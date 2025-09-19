import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiFromError, apiSuccess } from "@/lib/api-response";
import { handleError, validationError } from "@/lib/error-handler";
import { mergeTranscriptionResults, transcribeChunks } from "@/lib/groq-client";
import { WordTimestampService } from "@/lib/word-timestamp-service";

const transcribeSchema = z.object({
  fileData: z.object({
    arrayBuffer: z.any(), // Will be ArrayBuffer from client
    name: z.string(),
    size: z.number(),
    type: z.string(),
    duration: z.number(), // Duration calculated on client
  }),
  language: z.string().optional().default("ja"),
  chunkSeconds: z.number().int().positive().optional().default(45),
  overlap: z.number().positive().optional().default(0.2),
  chunks: z.array(
    z.object({
      arrayBuffer: z.any(),
      startTime: z.number(),
      endTime: z.number(),
      duration: z.number(),
      index: z.number(),
    }),
  ),
});

export async function POST(request: NextRequest) {
  try {
    console.log("🔥 Transcribe API called - START");
    const body = await request.json();
    console.log("📦 Request data:", {
      fileName: body.fileData?.name,
      fileSize: body.fileData?.size,
      language: body.language,
      chunkCount: body.chunks?.length,
    });

    const validation = transcribeSchema.safeParse(body);

    if (!validation.success) {
      console.error("❌ Validation failed:", validation.error.format());
      const error = validationError(
        "Invalid request data",
        validation.error.format(),
      );
      return apiError(error);
    }

    console.log("✅ Validation passed");

    const { fileData, language, chunks } = validation.data;

    try {
      console.log("🎵 Processing", chunks.length, "audio chunks...");

      // Convert chunk data back to Blobs for processing
      console.log("🔄 Converting chunk data back to Blobs...");
      const processableChunks = chunks.map((chunk, index) => {
        const arrayBuffer = new Uint8Array(chunk.arrayBuffer.data).buffer;
        const blob = new Blob([arrayBuffer], { type: "audio/wav" });
        console.log(`📦 Chunk ${index}:`, {
          startTime: chunk.startTime,
          endTime: chunk.endTime,
          duration: chunk.duration,
          blobSize: blob.size,
          arrayBufferSize: arrayBuffer.byteLength,
        });
        return {
          blob,
          startTime: chunk.startTime,
          endTime: chunk.endTime,
          duration: chunk.duration,
          index: index,
        };
      });
      console.log("✅ All chunks converted to Blobs");

      console.log(
        "🔄 About to call transcribeChunks with",
        processableChunks.length,
        "chunks",
      );
      console.log("🔧 transcribeChunks options:", { language });

      // Add timeout to prevent infinite waiting
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Transcription timeout after 5 minutes")),
          5 * 60 * 1000,
        );
      });

      const results = (await Promise.race([
        transcribeChunks(processableChunks, {
          language,
          onProgress: async (progress) => {
            console.log("📊 Transcription progress:", progress);
          },
        }),
        timeoutPromise,
      ])) as any;
      console.log(
        "✅ transcribeChunks completed with",
        results.length,
        "results",
      );

      console.log("🔄 Merging transcription results...");
      const mergedResult = mergeTranscriptionResults(results);
      console.log("✅ Results merged:", {
        textLength: mergedResult.text?.length,
        segmentCount: mergedResult.segments?.length,
        duration: mergedResult.duration,
      });

      console.log("🔄 Generating word timestamps...");
      const segments = (mergedResult.segments || []).map((segment) => {
        const wordTimestamps = WordTimestampService.generateWordTimestamps(
          segment.text,
          segment.start,
          segment.end,
        );

        return {
          start: segment.start,
          end: segment.end,
          text: segment.text,
          wordTimestamps,
        };
      });
      console.log(
        "✅ Word timestamps generated for",
        segments.length,
        "segments",
      );

      console.log("🎉 Preparing final API response...");
      const finalResponse = {
        text: mergedResult.text,
        duration: fileData.duration,
        segments: segments,
        segmentCount: segments.length,
        processingTime: 0,
      };
      console.log("📦 Final response:", {
        textLength: finalResponse.text?.length,
        segmentCount: finalResponse.segmentCount,
        duration: finalResponse.duration,
      });

      return apiSuccess(finalResponse);
    } catch (error) {
      const appError = handleError(error, "transcribe/POST-inner");
      return apiError(appError);
    }
  } catch (error) {
    return apiFromError(error, "transcribe/POST");
  }
}

// GET endpoint is not needed for stateless API

// DELETE endpoint is not needed for stateless API
