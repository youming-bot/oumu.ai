import type { AudioChunk } from "./audio-processor";
import { GroqClient } from "./groq-client";
import { HFClient, mergeHFTranscriptionResults } from "./hf-client";

export type TranscriptionProvider = "groq" | "huggingface" | "assemblyai";

export interface UnifiedTranscriptionRequest {
  file: Blob;
  model: string;
  language?: string;
  prompt?: string;
  responseFormat?: "json" | "text" | "srt" | "vtt" | "verbose_json";
  temperature?: number;
}

export interface UnifiedTranscriptionResponse {
  text: string;
  language?: string;
  duration?: number;
  segments?: Array<{
    id?: number;
    seek?: number;
    start: number;
    end: number;
    text: string;
    tokens?: number[];
    temperature?: number;
    avg_logprob?: number;
    compression_ratio?: number;
    no_speech_prob?: number;
  }>;
}

export interface TranscriptionProgress {
  chunkIndex: number;
  totalChunks: number;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  error?: string;
  provider?: TranscriptionProvider;
}

export type TranscriptionProgressCallback = (
  progress: TranscriptionProgress,
) => void;

export interface TranscriptionOptions {
  provider?: TranscriptionProvider;
  language?: string;
  prompt?: string;
  onProgress?: TranscriptionProgressCallback;
}

export class UnifiedTranscriptionService {
  private groqClient: GroqClient;
  private hfClient: HFClient;

  constructor() {
    this.groqClient = new GroqClient();
    this.hfClient = new HFClient();
  }

  /**
   * 自动选择最佳提供商
   */
  private selectProvider(): TranscriptionProvider {
    // 优先级：Groq > HuggingFace > AssemblyAI
    if (process.env.GROQ_API_KEY) {
      return "groq";
    }
    if (process.env.HF_API_KEY) {
      return "huggingface";
    }
    // 默认使用 HuggingFace（无需 API key 也可使用）
    return "huggingface";
  }

  /**
   * 转录单个音频块
   */
  async transcribeChunk(
    chunk: AudioChunk,
    options: {
      provider?: TranscriptionProvider;
      language?: string;
      prompt?: string;
    } = {},
  ): Promise<UnifiedTranscriptionResponse> {
    const provider = options.provider || this.selectProvider();

    console.log(`🎯 Using provider: ${provider} for chunk ${chunk.index}`);

    switch (provider) {
      case "groq":
        return this.groqClient.transcribeChunk(chunk, options);
      case "huggingface":
        return this.hfClient.transcribeChunk(chunk, options);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * 转录多个音频块
   */
  async transcribeChunks(
    chunks: AudioChunk[],
    options: TranscriptionOptions = {},
  ): Promise<Array<UnifiedTranscriptionResponse & { chunkIndex: number }>> {
    const provider = options.provider || this.selectProvider();

    console.log(`🎯 Using provider: ${provider} for ${chunks.length} chunks`);

    switch (provider) {
      case "groq":
        return this.groqClient.transcribeChunks(chunks, options);
      case "huggingface":
        return this.hfClient.transcribeChunks(chunks, options);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * 合并转录结果
   */
  mergeResults(
    results: Array<UnifiedTranscriptionResponse & { chunkIndex: number }>,
  ): UnifiedTranscriptionResponse {
    if (results.length === 0) {
      return { text: "", segments: [] };
    }

    const mergedText = results
      .map((result) => result.text.trim())
      .filter((text) => text.length > 0)
      .join(" ");

    const mergedSegments = results
      .flatMap((result) => result.segments || [])
      .sort((a, b) => a.start - b.start);

    return {
      text: mergedText,
      language: results[0]?.language,
      duration:
        mergedSegments.length > 0
          ? Math.max(...mergedSegments.map((s) => s.end))
          : undefined,
      segments: mergedSegments.length > 0 ? mergedSegments : undefined,
    };
  }

  /**
   * 检查提供商的可用性
   */
  checkProviderAvailability(provider: TranscriptionProvider): {
    available: boolean;
    reason?: string;
  } {
    switch (provider) {
      case "groq":
        return {
          available: !!process.env.GROQ_API_KEY,
          reason: process.env.GROQ_API_KEY ? undefined : "GROQ_API_KEY not set",
        };
      case "huggingface":
        return {
          available: true, // HuggingFace works without API key
          reason: undefined,
        };
      default:
        return {
          available: false,
          reason: "Unsupported provider",
        };
    }
  }

  /**
   * 获取所有可用提供商
   */
  getAvailableProviders(): Array<{
    provider: TranscriptionProvider;
    available: boolean;
    reason?: string;
  }> {
    const providers: TranscriptionProvider[] = ["groq", "huggingface"];
    return providers.map((provider) => ({
      provider,
      ...this.checkProviderAvailability(provider),
    }));
  }
}

// 导出单例实例
export const unifiedTranscriptionService = new UnifiedTranscriptionService();
