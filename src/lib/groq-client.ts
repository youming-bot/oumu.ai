import Groq from "groq-sdk";
import type { AudioChunk } from "./audio-processor";

export interface GroqTranscriptionResponse {
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
    // biome-ignore lint/style/useNamingConvention: These are Groq API response fields
    avg_logprob: number;
    // biome-ignore lint/style/useNamingConvention: These are Groq API response fields
    compression_ratio: number;
    // biome-ignore lint/style/useNamingConvention: These are Groq API response fields
    no_speech_prob: number;
  }>;
}

export interface GroqTranscriptionOptions {
  language?: string;
  prompt?: string;
  // biome-ignore lint/style/useNamingConvention: This is Groq API parameter name
  response_format?: "json" | "text" | "verbose_json";
  temperature?: number;
  onProgress?: (progress: {
    chunkIndex: number;
    totalChunks: number;
    status: "pending" | "processing" | "completed" | "failed";
    progress: number;
    error?: string;
  }) => void;
}

export class GroqClient {
  private client: any;

  constructor(apiKey: string = process.env.GROQ_API_KEY || "") {
    this.client = new Groq({ apiKey });
  }

  async transcribe(
    file: File,
    options: {
      language?: string;
      model?: string;
      responseFormat?: string;
      temperature?: number;
    } = {},
  ): Promise<GroqTranscriptionResponse> {
    const transcription = await (this.client as any).audio.transcriptions.create({
      file,
      model: options.model || "whisper-large-v3-turbo",
      language: options.language || "auto",
      // biome-ignore lint/style/useNamingConvention: This is Groq API parameter name
      response_format: (options.responseFormat as any) || "verbose_json",
      temperature: options.temperature || 0,
    });

    return transcription as GroqTranscriptionResponse;
  }

  async transcribeChunk(
    chunk: AudioChunk,
    options: {
      language?: string;
      prompt?: string;
      // biome-ignore lint/style/useNamingConvention: This is Groq API parameter name
      response_format?: "json" | "text" | "srt" | "verbose_json" | "vtt";
      temperature?: number;
    } = {},
  ): Promise<GroqTranscriptionResponse> {
    const file = new File([chunk.blob], `chunk_${chunk.index}.wav`, {
      type: "audio/wav",
    });

    const transcription = await (this.client as any).audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      language: options.language || "ja",
      prompt: options.prompt,
      // biome-ignore lint/style/useNamingConvention: This is Groq API parameter name
      response_format:
        (options.response_format as "json" | "text" | "verbose_json") || "verbose_json",
      temperature: options.temperature || 0,
    });

    return transcription as GroqTranscriptionResponse;
  }

  async transcribeChunks(
    chunks: AudioChunk[],
    options: GroqTranscriptionOptions = {},
  ): Promise<Array<GroqTranscriptionResponse & { chunkIndex: number }>> {
    const results: Array<GroqTranscriptionResponse & { chunkIndex: number }> = [];
    const errors: Array<{ chunkIndex: number; error: Error }> = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      try {
        options.onProgress?.({
          chunkIndex: i,
          totalChunks: chunks.length,
          status: "processing",
          progress: (i / chunks.length) * 100,
        });

        const result = await this.transcribeChunk(chunk, {
          language: options.language,
          prompt: options.prompt,
          // biome-ignore lint/style/useNamingConvention: This is Groq API parameter name
          response_format: options.response_format,
          temperature: options.temperature,
        });

        results.push({ ...result, chunkIndex: i });

        options.onProgress?.({
          chunkIndex: i,
          totalChunks: chunks.length,
          status: "completed",
          progress: ((i + 1) / chunks.length) * 100,
        });

        // 添加延迟以避免速率限制
        if (i < chunks.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        errors.push({
          chunkIndex: i,
          error: error instanceof Error ? error : new Error(String(error)),
        });

        options.onProgress?.({
          chunkIndex: i,
          totalChunks: chunks.length,
          status: "failed",
          progress: (i / chunks.length) * 100,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (errors.length > 0) {
      const errorMessage = errors
        .map((e) => `Chunk ${e.chunkIndex}: ${e.error.message}`)
        .join("; ");
      throw new Error(`Failed to transcribe ${errors.length} chunks: ${errorMessage}`);
    }

    return results.sort((a, b) => a.chunkIndex - b.chunkIndex);
  }
}

// 合并 Groq 转录结果
export function mergeGroqTranscriptionResults(
  results: Array<GroqTranscriptionResponse & { chunkIndex: number }>,
): GroqTranscriptionResponse {
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
    duration: results[0]?.duration,
    segments: mergedSegments.length > 0 ? mergedSegments : undefined,
  };
}

// 导出单例实例（延迟初始化）
let groqClientInstance: GroqClient | null = null;

export function getGroqClient(): GroqClient {
  if (!groqClientInstance) {
    groqClientInstance = new GroqClient();
  }
  return groqClientInstance;
}

// 为了向后兼容，导出 getter
export const groqClient = getGroqClient();

// 测试环境重置函数
export function resetGroqClient(): void {
  groqClientInstance = null;
}

// 导出便捷函数
export async function transcribeWithGroq(
  chunks: AudioChunk[],
  options: GroqTranscriptionOptions = {},
): Promise<{
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
}> {
  const results = await groqClient.transcribeChunks(chunks, {
    language: options.language,
    prompt: options.prompt,
    // biome-ignore lint/style/useNamingConvention: This is Groq API parameter name
    response_format: options.response_format,
    temperature: options.temperature,
    onProgress: options.onProgress,
  });

  // 使用现有的合并函数
  const mergedResult = mergeGroqTranscriptionResults(results);

  return {
    text: mergedResult.text || "",
    duration: mergedResult.duration,
    segments: mergedResult.segments?.map((segment) => ({
      start: segment.start,
      end: segment.end,
      text: segment.text,
      wordTimestamps: [], // Groq doesn't provide word-level timestamps in the same format
    })),
  };
}
