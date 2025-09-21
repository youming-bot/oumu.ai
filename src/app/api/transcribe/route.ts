import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiFromError, apiSuccess } from '@/lib/api-response';
import { handleError, validationError } from '@/lib/error-handler';
import {
  type TranscriptionResult,
  transcribeWithHuggingFace,
} from '@/lib/huggingface-transcription';
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
    const body = await request.json();

    const validation = transcribeSchema.safeParse(body);

    if (!validation.success) {
      const error = validationError('Invalid request data', validation.error.format());
      return apiError(error);
    }

    const { fileData, language, chunks } = validation.data;

    try {
      const processableChunks = chunks.map((chunk, index) => {
        const arrayBuffer = new Uint8Array(chunk.arrayBuffer.data).buffer;
        const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
        return {
          blob,
          startTime: chunk.startTime,
          endTime: chunk.endTime,
          duration: chunk.duration,
          index: index,
        };
      });

      // Add timeout to prevent infinite waiting
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Transcription timeout after 5 minutes')), 5 * 60 * 1000);
      });

      const result = (await Promise.race([
        transcribeWithHuggingFace(processableChunks, {
          language,
          onProgress: async (_progress) => {
            // Progress callback - intentionally empty for now
          },
        }),
        timeoutPromise,
      ])) as TranscriptionResult; // Type assertion for now
      const segments = (result.segments || []).map((segment) => {
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
      const finalResponse = {
        text: result.text,
        duration: fileData.duration,
        segments: segments,
        segmentCount: segments.length,
        processingTime: 0,
      };

      return apiSuccess(finalResponse);
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
