import type { AudioChunk } from "./audio-processor";
import {
  mergeTranscriptionResults,
  transcribeChunks as transcribeWithGroq,
} from "./groq-client";
import { HFClient, mergeHFTranscriptionResults } from "./hf-client";
import {
  getAvailableProviders,
  getTranscriptionConfig,
} from "./transcription-config";

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

export interface TranscriptionProgress {
  chunkIndex: number;
  totalChunks: number;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  error?: string;
  provider?: string;
}

export type TranscriptionProgressCallback = (
  progress: TranscriptionProgress,
) => void;

export interface TranscriptionOptions {
  language?: string;
  prompt?: string;
  onProgress?: TranscriptionProgressCallback;
  providers?: string[];
}

/**
 * 简化的转录服务，支持多个提供商的自动回退
 */
export class SimpleTranscriptionService {
  private hfClient: HFClient;

  constructor() {
    this.hfClient = new HFClient();
  }

  async transcribeWithFallback(
    chunks: AudioChunk[],
    options: TranscriptionOptions = {},
  ): Promise<{ results: any[]; provider: string }> {
    const config = getTranscriptionConfig();
    const providers = options.providers || config.providers;
    const availableProviders = providers.filter((provider) =>
      this.isProviderAvailable(provider),
    );

    console.log(
      "🔄 Starting transcription with providers:",
      availableProviders,
    );

    for (const provider of availableProviders) {
      try {
        console.log(`🎤 Trying provider: ${provider}`);

        const result = await this.transcribeWithProvider(chunks, {
          ...options,
          provider,
        });

        console.log(`✅ Transcription successful with provider: ${provider}`);
        return {
          results: result,
          provider,
        };
      } catch (error) {
        console.error(`❌ Provider ${provider} failed:`, error);

        // Report the error to progress callback
        options.onProgress?.({
          chunkIndex: 0,
          totalChunks: chunks.length,
          status: "failed",
          progress: 0,
          error: `Provider ${provider} failed: ${error instanceof Error ? error.message : String(error)}`,
          provider,
        });

        // If this is the last provider, throw the error
        if (provider === availableProviders[availableProviders.length - 1]) {
          throw new Error(
            `All transcription providers failed. Last error: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

        // Otherwise, continue to the next provider
        console.log(`🔄 Moving to next provider...`);
      }
    }

    throw new Error("No available transcription providers");
  }

  private async transcribeWithProvider(
    chunks: AudioChunk[],
    options: TranscriptionOptions & { provider: string },
  ): Promise<any[]> {
    const { provider, ...restOptions } = options;

    switch (provider.toLowerCase()) {
      case "groq":
        return this.transcribeWithGroq(chunks, restOptions);
      case "huggingface":
      case "hf":
        return this.transcribeWithHuggingFace(chunks, restOptions);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private async transcribeWithGroq(
    chunks: AudioChunk[],
    options: Omit<TranscriptionOptions, "provider">,
  ): Promise<any[]> {
    console.log("🚀 Using Groq for transcription");

    const results = await transcribeWithGroq(chunks, {
      language: options.language,
      prompt: options.prompt,
      onProgress: (progress) => {
        options.onProgress?.({
          ...progress,
          provider: "groq",
        });
      },
    });

    return results;
  }

  private async transcribeWithHuggingFace(
    chunks: AudioChunk[],
    options: Omit<TranscriptionOptions, "provider">,
  ): Promise<any[]> {
    console.log("🤖 Using HuggingFace for transcription");

    const results = await this.hfClient.transcribeChunks(chunks, {
      language: options.language,
      prompt: options.prompt,
      onProgress: (progress) => {
        options.onProgress?.({
          ...progress,
          provider: "huggingface",
        });
      },
    });

    return results;
  }

  private isProviderAvailable(provider: string): boolean {
    const settings = this.getProviderSettings(provider);
    return !!settings.apiKey || provider.toLowerCase() === "huggingface";
  }

  private getProviderSettings(provider: string): {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    supportsLanguage?: boolean;
    supportsPrompt?: boolean;
    maxFileSize?: number;
    maxDuration?: number;
  } {
    switch (provider.toLowerCase()) {
      case "groq":
        return {
          apiKey: process.env.GROQ_API_KEY,
          baseUrl: "https://api.groq.com/openai/v1",
          model: "whisper-large-v3-turbo",
          supportsLanguage: true,
          supportsPrompt: true,
          maxFileSize: 25 * 1024 * 1024, // 25MB
          maxDuration: 600, // 10 minutes
        };

      case "huggingface":
      case "hf":
        return {
          apiKey: process.env.HF_API_KEY,
          baseUrl:
            "https://api-inference.huggingface.co/models/openai/whisper-large-v3",
          model: "openai/whisper-large-v3",
          supportsLanguage: true,
          supportsPrompt: true,
          maxFileSize: 25 * 1024 * 1024, // 25MB
          maxDuration: 600, // 10 minutes
        };

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
}

// 创建一个全局实例
export const simpleTranscriptionService = new SimpleTranscriptionService();

// 便捷函数
export async function transcribeWithFallback(
  chunks: AudioChunk[],
  options: TranscriptionOptions = {},
): Promise<{ results: any[]; provider: string }> {
  return simpleTranscriptionService.transcribeWithFallback(chunks, options);
}

/**
 * 根据提供商合并转录结果
 */
export function mergeTranscriptionResultsByProvider(
  results: any[],
  provider: string,
): TranscriptionResult {
  switch (provider.toLowerCase()) {
    case "groq":
      const groqResult = mergeTranscriptionResults(results);
      return {
        text: groqResult.text,
        duration: groqResult.duration,
        segments: groqResult.segments?.map((segment) => ({
          start: segment.start,
          end: segment.end,
          text: segment.text,
          wordTimestamps: (segment as any).wordTimestamps || [], // Type assertion for compatibility
        })),
      };

    case "huggingface":
    case "hf":
      const hfResult = mergeHFTranscriptionResults(results);
      return {
        text: hfResult.text,
        duration: hfResult.duration,
        segments: hfResult.segments?.map((segment) => ({
          start: segment.start,
          end: segment.end,
          text: segment.text,
          wordTimestamps: [], // HuggingFace doesn't provide word-level timestamps by default
        })),
      };

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
