import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiFromError, apiSuccess } from '@/lib/api-response';
import { handleError, validationError } from '@/lib/error-handler';
import { mergeTranscriptionResults, transcribeChunks } from '@/lib/groq-client';
import { WordTimestampService } from '@/lib/word-timestamp-service';

const transcribeSchema = z.object({
  fileData: z.object({
    arrayBuffer: z.any(), // Will be ArrayBuffer from client
    name: z.string(),
    size: z.number(),
    type: z.string(),
    duration: z.number(), // Duration calculated on client
  }),
  language: z.string().optional().default('ja'),
  chunkSeconds: z.number().int().positive().optional().default(45),
  overlap: z.number().positive().optional().default(0.2),
  chunks: z.array(
    z.object({
      arrayBuffer: z.any(),
      startTime: z.number(),
      endTime: z.number(),
      duration: z.number(),
      index: z.number(),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 Transcribe API called');
    const body = await request.json();
    console.log('📦 Request data:', {
      fileName: body.fileData?.name,
      fileSize: body.fileData?.size,
      language: body.language,
      chunkCount: body.chunks?.length,
    });

    const validation = transcribeSchema.safeParse(body);

    if (!validation.success) {
      const error = validationError('Invalid request data', validation.error.format());
      return apiError(error);
    }

    const { fileData, language, chunks } = validation.data;

    try {
      console.log('🎵 Processing', chunks.length, 'audio chunks...');

      // Convert chunk data back to Blobs for processing
      const processableChunks = chunks.map((chunk, index) => {
        const arrayBuffer = new Uint8Array(chunk.arrayBuffer.data).buffer;
        return {
          blob: new Blob([arrayBuffer], { type: 'audio/wav' }),
          startTime: chunk.startTime,
          endTime: chunk.endTime,
          duration: chunk.duration,
          index: index,
        };
      });

      const results = await transcribeChunks(processableChunks, {
        language,
        onProgress: async (progress) => {
          console.log('📊 Transcription progress:', progress);
        },
      });

      const mergedResult = mergeTranscriptionResults(results);

      const segments = (mergedResult.segments || []).map((segment) => {
        const wordTimestamps = WordTimestampService.generateWordTimestamps(
          segment.text,
          segment.start,
          segment.end
        );

        return {
          start: segment.start,
          end: segment.end,
          text: segment.text,
          wordTimestamps,
        };
      });

      return apiSuccess({
        text: mergedResult.text,
        duration: fileData.duration,
        segments: segments,
        segmentCount: segments.length,
        processingTime: 0,
      });
    } catch (error) {
      const appError = handleError(error, 'transcribe/POST-inner');
      return apiError(appError);
    }
  } catch (error) {
    return apiFromError(error, 'transcribe/POST');
  }
}

// GET endpoint is not needed for stateless API

// DELETE endpoint is not needed for stateless API
