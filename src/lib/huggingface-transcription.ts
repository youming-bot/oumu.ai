import type { AudioChunk } from './audio-processor';
import { HFClient, mergeHFTranscriptionResults } from './hf-client';

export interface TranscriptionOptions {
  language?: string;
  prompt?: string;
  onProgress?: (progress: {
    chunkIndex: number;
    totalChunks: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    error?: string;
  }) => void;
}

export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
    wordTimestamps?: Array<{
      word: string;
      start: number;
      end: number;
    }>;
  }>;
}

export class HuggingFaceTranscriptionService {
  private hfClient: HFClient;

  constructor() {
    this.hfClient = new HFClient();
  }

  async transcribe(
    chunks: AudioChunk[],
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    const results = await this.hfClient.transcribeChunks(chunks, {
      language: options.language,
      prompt: options.prompt,
      onProgress: (progress) => {
        options.onProgress?.(progress);
      },
    });

    // Use the existing merge function
    const mergedResult = mergeHFTranscriptionResults(results);

    return {
      text: mergedResult.text || '',
      language: mergedResult.language,
      duration: mergedResult.duration,
      segments: mergedResult.segments?.map((segment) => ({
        start: segment.start,
        end: segment.end,
        text: segment.text,
        wordTimestamps: [], // HuggingFace doesn't provide word-level timestamps
      })),
    };
  }
}

// Export singleton instance
export const huggingFaceTranscriptionService = new HuggingFaceTranscriptionService();

// Export convenience function
export async function transcribeWithHuggingFace(
  chunks: AudioChunk[],
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  return huggingFaceTranscriptionService.transcribe(chunks, options);
}
