import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiFromError, apiSuccess } from '@/lib/api-response';
import { validationError } from '@/lib/error-handler';
import { postProcessSegments } from '@/lib/openrouter-client';

const postProcessSchema = z.object({
  segments: z.array(
    z.object({
      text: z.string(),
      start: z.number(),
      end: z.number(),
      wordTimestamps: z
        .array(
          z.object({
            word: z.string(),
            start: z.number(),
            end: z.number(),
          })
        )
        .optional(),
    })
  ),
  language: z.string().optional().default('ja'),
  targetLanguage: z.string().optional().default('en'),
  enableAnnotations: z.boolean().optional().default(true),
  enableFurigana: z.boolean().optional().default(true),
  enableTerminology: z.boolean().optional().default(true),
  terminology: z
    .array(
      z.object({
        id: z.number().optional(),
        word: z.string(),
        reading: z.string().optional(),
        meaning: z.string(),
        category: z.string().optional(),
        examples: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        createdAt: z.date(),
        updatedAt: z.date(),
      })
    )
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = postProcessSchema.safeParse(body);

    if (!validation.success) {
      const error = validationError('Invalid request data', validation.error.format());
      return apiError(error);
    }

    const {
      segments,
      language,
      targetLanguage,
      enableAnnotations,
      enableFurigana,
      enableTerminology,
      terminology,
    } = validation.data;

    const processedSegments = await postProcessSegments(segments, language, {
      targetLanguage,
      enableAnnotations,
      enableFurigana,
      enableTerminology,
      customTerminology: enableTerminology ? terminology : undefined,
      maxRetries: 3,
      timeout: 30000,
    });

    // Return processed segments with original metadata preserved
    const finalSegments = processedSegments.map((processedSegment, index) => ({
      ...segments[index], // Preserve original segment data
      normalizedText: processedSegment.normalizedText,
      translation: processedSegment.translation,
      annotations: processedSegment.annotations,
      furigana: processedSegment.furigana,
    }));

    return apiSuccess({
      processedSegments: finalSegments.length,
      segments: finalSegments,
    });
  } catch (error) {
    return apiFromError(error, 'postprocess/POST');
  }
}

// GET endpoint is not needed for stateless API

// PATCH endpoint is not needed for stateless API
