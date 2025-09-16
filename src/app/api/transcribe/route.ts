import { NextRequest } from 'next/server';
import { db, DBUtils } from '@/lib/db';
import { GroqTranscriptionClient } from '@/lib/groq-client';
import { AudioProcessor } from '@/lib/audio-processor';
import { WordTimestampService } from '@/lib/word-timestamp-service';
import { ApiResponse } from '@/lib/api-response';
import { ErrorHandler } from '@/lib/error-handler';
import { z } from 'zod';

const transcribeSchema = z.object({
  fileId: z.number().int().positive(),
  language: z.string().optional().default('ja'),
  chunkSeconds: z.number().int().positive().optional().default(45),
  overlap: z.number().positive().optional().default(0.2),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = transcribeSchema.safeParse(body);
    
    if (!validation.success) {
      const error = ErrorHandler.validationError(
        'Invalid request data',
        validation.error.format()
      );
      return ApiResponse.error(error);
    }

    const { fileId, language, chunkSeconds, overlap } = validation.data;

    const file = await DBUtils.getFile(fileId);
    if (!file) {
      const error = ErrorHandler.notFoundError('File not found', { fileId });
      return ApiResponse.error(error);
    }

    const existingTranscripts = await DBUtils.getTranscriptsByFileId(fileId);
    const hasCompletedTranscript = existingTranscripts.some(t => t.status === 'completed');
    
    if (hasCompletedTranscript) {
      const error = ErrorHandler.createError(
        'FILE_ALREADY_PROCESSED',
        'File already has a completed transcription',
        { fileId },
        409
      );
      return ApiResponse.error(error);
    }

    const transcriptId = await DBUtils.addTranscript({
      fileId,
      status: 'processing',
      language,
      rawText: '',
      processingTime: 0
    });

    try {
      const chunks = await AudioProcessor.processAudioFile(
        fileId, 
        chunkSeconds, 
        overlap
      );

      console.log(`Processing ${chunks.length} audio chunks for file ${fileId}`);

      const results = await GroqTranscriptionClient.transcribeChunks(chunks, {
        language,
        onProgress: async (progress) => {
          console.log(`Transcription progress: ${progress.progress}%`);

          await DBUtils.updateTranscript(transcriptId, {
            status: 'processing',
          });
        },
      });

      const mergedResult = GroqTranscriptionClient.mergeTranscriptionResults(results);

      const segments = (mergedResult.segments || []).map((segment) => {
        // Generate word-level timestamps for each segment
        const wordTimestamps = WordTimestampService.generateWordTimestamps(
          segment.text,
          segment.start,
          segment.end
        );

        return {
          transcriptId,
          start: segment.start,
          end: segment.end,
          text: segment.text,
          wordTimestamps,
        };
      });

      await DBUtils.addSegments(segments);

      await DBUtils.updateTranscript(transcriptId, {
        status: 'completed',
        rawText: mergedResult.text,
        processingTime: 0,
      });

      console.log(`Transcription completed for file ${fileId}: ${mergedResult.text.length} characters`);

      return ApiResponse.success({
        transcriptId,
        text: mergedResult.text,
        duration: mergedResult.duration,
        segmentCount: segments.length,
        processingTime: 0,
      });

    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'transcribe/POST-inner');

      await DBUtils.updateTranscript(transcriptId, {
        status: 'failed',
        error: appError.message,
      });

      return ApiResponse.error(appError);
    }

  } catch (error) {
    return ApiResponse.fromError(error, 'transcribe/POST');
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    
    if (!fileId) {
      const error = ErrorHandler.validationError('fileId parameter is required');
      return ApiResponse.error(error);
    }

    const fileIdNum = parseInt(fileId, 10);
    if (isNaN(fileIdNum)) {
      const error = ErrorHandler.validationError('fileId must be a number');
      return ApiResponse.error(error);
    }

    const transcripts = await DBUtils.getTranscriptsByFileId(fileIdNum);
    
    const transcriptsWithSegments = await Promise.all(
      transcripts.map(async (transcript) => {
        if (!transcript.id) {
          throw ErrorHandler.createError(
            'DB_INTEGRITY_ERROR',
            'Transcript missing id',
            { transcript }
          );
        }
        const segments = await DBUtils.getSegmentsByTranscriptId(transcript.id);
        return {
          ...transcript,
          segments,
        };
      })
    );

    return ApiResponse.success({
      transcripts: transcriptsWithSegments,
    });

  } catch (error) {
    return ApiResponse.fromError(error, 'transcribe/GET');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transcriptId = searchParams.get('transcriptId');
    
    if (!transcriptId) {
      const error = ErrorHandler.validationError('transcriptId parameter is required');
      return ApiResponse.error(error);
    }

    const transcriptIdNum = parseInt(transcriptId, 10);
    if (isNaN(transcriptIdNum)) {
      const error = ErrorHandler.validationError('transcriptId must be a number');
      return ApiResponse.error(error);
    }

    const transcript = await DBUtils.getTranscript(transcriptIdNum);
    if (!transcript) {
      const error = ErrorHandler.notFoundError('Transcript not found', { transcriptId: transcriptIdNum });
      return ApiResponse.error(error);
    }

    await db.transaction('rw', db.transcripts, db.segments, async () => {
      await DBUtils.deleteTranscript(transcriptIdNum);
    });

    return ApiResponse.success({
      message: 'Transcript deleted successfully',
    });

  } catch (error) {
    return ApiResponse.fromError(error, 'transcribe/DELETE');
  }
}