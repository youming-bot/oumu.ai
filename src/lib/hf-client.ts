import type { AudioChunk } from "./audio-processor";

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
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
  }>;
}

export interface HFTranscriptionRequest {
  file: Blob;
  model: string;
  language?: string;
  prompt?: string;
}

export class HFClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string = process.env.HF_API_KEY || "") {
    this.apiKey = apiKey;
    this.baseUrl =
      "https://api-inference.huggingface.co/models/openai/whisper-large-v3";
  }

  async transcribeChunk(
    chunk: AudioChunk,
    options: {
      language?: string;
      prompt?: string;
    } = {},
  ): Promise<HFTranscriptionResponse> {
    console.log("🤖 HuggingFace transcribeChunk called for chunk", chunk.index);

    try {
      const formData = new FormData();
      formData.append("file", chunk.blob, `chunk_${chunk.index}.wav`);

      if (options.language) {
        formData.append("language", options.language);
      }

      if (options.prompt) {
        formData.append("prompt", options.prompt);
      }

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: formData,
      });

      console.log("📡 HF API Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HuggingFace API error: ${response.status} - ${errorText}`,
        );
      }

      const result = await response.json();
      console.log(
        "✅ HuggingFace transcription successful for chunk",
        chunk.index,
      );
      return result;
    } catch (error) {
      console.error(
        "❌ HuggingFace transcription failed for chunk",
        chunk.index,
        ":",
        error,
      );
      throw error;
    }
  }

  async transcribeChunks(
    chunks: AudioChunk[],
    options: {
      language?: string;
      prompt?: string;
      onProgress?: (progress: {
        chunkIndex: number;
        totalChunks: number;
        status: "pending" | "processing" | "completed" | "failed";
        progress: number;
        error?: string;
      }) => void;
    } = {},
  ): Promise<Array<HFTranscriptionResponse & { chunkIndex: number }>> {
    console.log(
      "🤖 HuggingFace transcribeChunks called with",
      chunks.length,
      "chunks",
    );

    const results: Array<HFTranscriptionResponse & { chunkIndex: number }> = [];
    const errors: Array<{ chunkIndex: number; error: Error }> = [];

    // Process chunks sequentially to avoid rate limiting
    console.log("🔄 Starting sequential chunk processing...");
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`🎵 Processing chunk ${i + 1}/${chunks.length}...`);

      try {
        options.onProgress?.({
          chunkIndex: i,
          totalChunks: chunks.length,
          status: "processing",
          progress: (i / chunks.length) * 100,
        });

        console.log(`📤 Transcribing chunk ${i}...`);
        const result = await this.transcribeChunk(chunk, options);
        console.log(`✅ Chunk ${i} transcription completed`);
        results.push({ ...result, chunkIndex: i });

        options.onProgress?.({
          chunkIndex: i,
          totalChunks: chunks.length,
          status: "completed",
          progress: ((i + 1) / chunks.length) * 100,
        });

        // Add delay between requests to avoid rate limiting
        if (i < chunks.length - 1) {
          console.log(`⏳ Waiting 1 second before next chunk...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ Chunk ${i} failed:`, error);
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

    console.log("🎉 All chunks processed, checking for errors...");

    if (errors.length > 0) {
      const errorMessage = errors
        .map((e) => `Chunk ${e.chunkIndex}: ${e.error.message}`)
        .join("; ");
      throw new Error(
        `Failed to transcribe ${errors.length} chunks: ${errorMessage}`,
      );
    }

    return results.sort((a, b) => a.chunkIndex - b.chunkIndex);
  }
}

export function mergeHFTranscriptionResults(
  results: Array<HFTranscriptionResponse & { chunkIndex: number }>,
): HFTranscriptionResponse {
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
    segments: mergedSegments.length > 0 ? mergedSegments : undefined,
  };
}
