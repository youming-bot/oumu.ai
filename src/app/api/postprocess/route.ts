import { NextRequest } from 'next/server';
import { db, DBUtils } from '@/lib/db';
import { OpenRouterClient } from '@/lib/openrouter-client';
import { ApiResponse } from '@/lib/api-response';
import { ErrorHandler } from '@/lib/error-handler';
import { z } from 'zod';
import { Term } from '@/types/database';

const postProcessSchema = z.object({
  transcriptId: z.number().int().positive(),
  targetLanguage: z.string().optional().default('en'),
  enableAnnotations: z.boolean().optional().default(true),
  enableFurigana: z.boolean().optional().default(true),
  enableTerminology: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = postProcessSchema.safeParse(body);
    
    if (!validation.success) {
      const error = ErrorHandler.validationError(
        'Invalid request data',
        validation.error.format()
      );
      return ApiResponse.error(error);
    }

    const { transcriptId, targetLanguage, enableAnnotations, enableFurigana, enableTerminology } = validation.data;

    const transcript = await DBUtils.getTranscript(transcriptId);
    if (!transcript) {
      const error = ErrorHandler.notFoundError('Transcript not found', { transcriptId });
      return ApiResponse.error(error);
    }

    if (transcript.status !== 'completed') {
      const error = ErrorHandler.validationError(
        'Transcript must be completed before post-processing',
        { transcriptId, currentStatus: transcript.status }
      );
      return ApiResponse.error(error);
    }

    const segments = await DBUtils.getSegmentsByTranscriptId(transcriptId);
    if (segments.length === 0) {
      const error = ErrorHandler.notFoundError('No segments found for transcript', { transcriptId });
      return ApiResponse.error(error);
    }

    console.log(`Starting post-processing for transcript ${transcriptId} with ${segments.length} segments`);

    // Load terminology if terminology processing is enabled
    let terminology: Term[] = [];
    if (enableTerminology) {
      try {
        terminology = await DBUtils.getAllTerms();
        console.log(`Loaded ${terminology.length} terms for terminology processing`);
      } catch (error) {
        ErrorHandler.handleSilently(error, 'postprocess/load-terminology');
        // Continue without terminology if loading fails
      }
    }

    const postProcessSegments = segments.map(segment => ({
      originalText: segment.text,
      normalizedText: segment.text,
      start: segment.start,
      end: segment.end,
    }));

    const processedSegments = await OpenRouterClient.postProcessSegments(
      postProcessSegments,
      transcript.language || 'ja',
      {
        targetLanguage,
        enableAnnotations,
        enableFurigana,
        enableTerminology,
        maxRetries: 3,
        timeout: 30000,
      },
      enableTerminology ? terminology : undefined
    );

    await db.transaction('rw', db.segments, async () => {
      for (const processedSegment of processedSegments) {
        const originalSegment = segments.find(s => 
          Math.abs(s.start - processedSegment.start) < 0.01 &&
          Math.abs(s.end - processedSegment.end) < 0.01
        );

        if (originalSegment && originalSegment.id) {
          await DBUtils.updateSegment(originalSegment.id, {
            normalizedText: processedSegment.normalizedText,
            translation: processedSegment.translation,
            annotations: processedSegment.annotations,
            furigana: processedSegment.furigana,
          });
        }
      }
    });

    console.log(`Post-processing completed for transcript ${transcriptId}`);

    const updatedSegments = await DBUtils.getSegmentsByTranscriptId(transcriptId);

    return ApiResponse.success({
      transcriptId,
      processedSegments: updatedSegments.length,
      segments: updatedSegments,
    });

  } catch (error) {
    return ApiResponse.fromError(error, 'postprocess/POST');
  }
}

export async function GET(request: NextRequest) {
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

    const segments = await DBUtils.getSegmentsByTranscriptId(transcriptIdNum);
    
    const hasPostProcessing = segments.some(segment =>
      segment.normalizedText ||
      segment.translation ||
      segment.annotations ||
      segment.furigana
    );

    return ApiResponse.success({
      transcriptId: transcriptIdNum,
      hasPostProcessing,
      segmentCount: segments.length,
      processedSegments: segments.filter(segment => segment.normalizedText).length,
      segments,
    });

  } catch (error) {
    return ApiResponse.fromError(error, 'postprocess/GET');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const segmentId = searchParams.get('segmentId');
    
    if (!segmentId) {
      const error = ErrorHandler.validationError('segmentId parameter is required');
      return ApiResponse.error(error);
    }

    const segmentIdNum = parseInt(segmentId, 10);
    if (isNaN(segmentIdNum)) {
      const error = ErrorHandler.validationError('segmentId must be a number');
      return ApiResponse.error(error);
    }

    const body = await request.json();
    const updateSchema = z.object({
      normalizedText: z.string().optional(),
      translation: z.string().optional(),
      annotations: z.array(z.string()).optional(),
      furigana: z.string().optional(),
    });

    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      const error = ErrorHandler.validationError(
        'Invalid update data',
        validation.error.format()
      );
      return ApiResponse.error(error);
    }

    const segment = await DBUtils.getSegment(segmentIdNum);
    if (!segment) {
      const error = ErrorHandler.notFoundError('Segment not found', { segmentId: segmentIdNum });
      return ApiResponse.error(error);
    }

    await DBUtils.updateSegment(segmentIdNum, validation.data);

    const updatedSegment = await DBUtils.getSegment(segmentIdNum);

    return ApiResponse.success({
      segment: updatedSegment,
    });

  } catch (error) {
    return ApiResponse.fromError(error, 'postprocess/PATCH');
  }
}