import type { AudioChunk } from './audio-processor';

// biome-ignore lint/style/useNamingConvention: External API response type
export interface HFTranscriptionResponse {
  text: string;
  language?: string;
  duration?: number;
  segments?: Array<{
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    // biome-ignore lint/style/useNamingConvention: External API field names
    avg_logprob: number;
    // biome-ignore lint/style/useNamingConvention: External API field names
    compression_ratio: number;
    // biome-ignore lint/style/useNamingConvention: External API field names
    no_speech_prob: number;
  }>;
}

// biome-ignore lint/style/useNamingConvention: HuggingFace API prefix
export interface HFTranscriptionRequest {
  file: Blob;
  model: string;
  language?: string;
  prompt?: string;
}

// biome-ignore lint/style/useNamingConvention: HuggingFace API prefix
export class HFClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string = process.env.HF_API_KEY || '') {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api-inference.huggingface.co/models/openai/whisper-large-v3';
  }

  async transcribeChunk(
    chunk: AudioChunk,
    options: {
      language?: string;
      prompt?: string;
    } = {}
  ): Promise<HFTranscriptionResponse> {
    const formData = new FormData();
    formData.append('file', chunk.blob, `chunk_${chunk.index}.wav`);

    if (options.language) {
      formData.append('language', options.language);
    }

    if (options.prompt) {
      formData.append('prompt', options.prompt);
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        // biome-ignore lint/style/useNamingConvention: HTTP header name
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HuggingFace API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  }

  async transcribeChunks(
    chunks: AudioChunk[],
    options: {
      language?: string;
      prompt?: string;
      onProgress?: (progress: {
        chunkIndex: number;
        totalChunks: number;
        status: 'pending' | 'processing' | 'completed' | 'failed';
        progress: number;
        error?: string;
      }) => void;
    } = {}
  ): Promise<Array<HFTranscriptionResponse & { chunkIndex: number }>> {
    const results: Array<HFTranscriptionResponse & { chunkIndex: number }> = [];
    const errors: Array<{ chunkIndex: number; error: Error }> = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      try {
        options.onProgress?.({
          chunkIndex: i,
          totalChunks: chunks.length,
          status: 'processing',
          progress: (i / chunks.length) * 100,
        });
        const result = await this.transcribeChunk(chunk, options);
        results.push({ ...result, chunkIndex: i });

        options.onProgress?.({
          chunkIndex: i,
          totalChunks: chunks.length,
          status: 'completed',
          progress: ((i + 1) / chunks.length) * 100,
        });

        // Add delay between requests to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        errors.push({
          chunkIndex: i,
          error: error instanceof Error ? error : new Error(String(error)),
        });

        options.onProgress?.({
          chunkIndex: i,
          totalChunks: chunks.length,
          status: 'failed',
          progress: (i / chunks.length) * 100,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (errors.length > 0) {
      const errorMessage = errors
        .map((e) => `Chunk ${e.chunkIndex}: ${e.error.message}`)
        .join('; ');
      throw new Error(`Failed to transcribe ${errors.length} chunks: ${errorMessage}`);
    }

    return results.sort((a, b) => a.chunkIndex - b.chunkIndex);
  }
}

// biome-ignore lint/style/useNamingConvention: HuggingFace API prefix
export function mergeHFTranscriptionResults(
  results: Array<HFTranscriptionResponse & { chunkIndex: number }>
): HFTranscriptionResponse {
  if (results.length === 0) {
    return { text: '', segments: [] };
  }

  const mergedText = results
    .map((result) => result.text.trim())
    .filter((text) => text.length > 0)
    .join(' ');

  const mergedSegments = results
    .flatMap((result) => result.segments || [])
    .sort((a, b) => a.start - b.start);

  return {
    text: mergedText,
    language: results[0]?.language,
    segments: mergedSegments.length > 0 ? mergedSegments : undefined,
  };
}
