import { HFClient, mergeHFTranscriptionResults } from "./hf-client";
import type { AudioChunk } from "./audio-processor";

export interface TranscriptionOptions {
  language?: string;
  prompt?: string;
  onProgress?: (progress: {
    chunkIndex: number;
    totalChunks: number;
    status: "pending" | "processing" | "completed" | "failed";
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
    console.log("🤖 Starting HuggingFace transcription...");
    console.log("📊 Processing", chunks.length, "chunks");

    try {
      const results = await this.hfClient.transcribeChunks(chunks, {
        language: options.language,
        prompt: options.prompt,
        onProgress: (progress) => {
          console.log("📊 Transcription progress:", progress);
          options.onProgress?.(progress);
        },
      });

      console.log("✅ All chunks transcribed successfully");
      console.log("🔄 Merging results...");

      // Use the existing merge function
      const mergedResult = mergeHFTranscriptionResults(results);

      console.log("🎉 Transcription completed successfully");
      console.log("📊 Final result:", {
        textLength: mergedResult.text?.length,
        segmentCount: mergedResult.segments?.length,
        language: mergedResult.language,
      });

      return {
        text: mergedResult.text || "",
        language: mergedResult.language,
        duration: mergedResult.duration,
        segments: mergedResult.segments?.map(segment => ({
          start: segment.start,
          end: segment.end,
          text: segment.text,
          wordTimestamps: [], // HuggingFace doesn't provide word-level timestamps
        })),
      };
    } catch (error) {
      console.error("❌ Transcription failed:", error);
      throw error;
    }
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
