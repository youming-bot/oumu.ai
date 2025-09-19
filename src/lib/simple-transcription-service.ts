import type { AudioChunk } from "./audio-processor";
import { transcribeChunks as groqTranscribeChunks, mergeTranscriptionResults as mergeGroqResults } from "./groq-client";
import { HFClient, mergeHFTranscriptionResults } from "./hf-client";
import { getAvailableProviders } from "./transcription-config";

export interface TranscriptionProgress {
  chunkIndex: number;
  totalChunks: number;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  error?: string;
  provider?: string;
}

export interface TranscriptionResult {
  text: string;
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
  segmentCount: number;
  processingTime: number;
}

export interface TranscriptionOptions {
  language?: string;
  providers?: string[];
  onProgress?: (progress: TranscriptionProgress) => void;
}

export async function transcribeWithFallback(
  chunks: AudioChunk[],
  options: TranscriptionOptions = {}
): Promise<{ results: any[]; provider: string }> {
  const availableProviders = options.providers || getAvailableProviders();
  const language = options.language || "ja";

  for (const provider of availableProviders) {
    try {
      console.log(`🔄 Trying transcription provider: ${provider}`);

      const progressCallback = (progress: TranscriptionProgress) => {
        options.onProgress?.({ ...progress, provider });
      };

      let results: any[];

      if (provider === "huggingface") {
        const hfClient = new HFClient();
        results = await hfClient.transcribeChunks(chunks, {
          language,
          onProgress: progressCallback,
        });
      } else if (provider === "groq") {
        results = await groqTranscribeChunks(chunks, {
          language,
          onProgress: progressCallback,
        });
      } else {
        throw new Error(`Unknown provider: ${provider}`);
      }

      console.log(`✅ Transcription successful with provider: ${provider}`);
      return { results, provider };

    } catch (error) {
      console.error(`❌ Transcription failed with provider ${provider}:`, error);

      // If this is the last provider, throw the error
      if (provider === availableProviders[availableProviders.length - 1]) {
        throw new Error(`All transcription providers failed. Last error: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Otherwise, try the next provider
      continue;
    }
  }

  throw new Error("No transcription providers available");
}

export function mergeTranscriptionResults(results: any[], provider: string): TranscriptionResult {
  let mergedResult: any;

  if (provider === "huggingface") {
    mergedResult = mergeHFTranscriptionResults(results);
  } else if (provider === "groq") {
    mergedResult = mergeGroqResults(results);
  } else {
    throw new Error(`Unknown provider: ${provider}`);
  }

  // Convert to unified format
  const segments = (mergedResult.segments || []).map((segment: any) => ({
    start: segment.start,
    end: segment.end,
    text: segment.text,
    wordTimestamps: [], // Word timestamps will be generated separately
  }));

  return {
    text: mergedResult.text || "",
    duration: mergedResult.duration,
    segments,
    segmentCount: segments.length,
    processingTime: 0,
  };
}
