import type { AudioChunk } from "./audio-processor";
import { GroqClient } from "./groq-client";
import { HFClient, mergeHFTranscriptionResults } from "./hf-client";

export interface TranscriptionProvider {
  name: string;
  transcribeChunks(
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
    }
  ): Promise<Array<any & { chunkIndex: number }>>;
}

export class TranscriptionProviderFactory {
  static createProvider(providerName: string): TranscriptionProvider {
    switch (providerName.toLowerCase()) {
      case "groq":
        return new GroqProvider();
      case "huggingface":
      case "hf":
        return new HuggingFaceProvider();
      case "openai":
        return new OpenAIProvider();
      case "assemblyai":
        return new AssemblyAIProvider();
      default:
        throw new Error(`Unknown transcription provider: ${providerName}`);
    }
  }

  static getAvailableProviders(): string[] {
    return ["groq", "huggingface", "openai", "assemblyai"];
  }
}

class GroqProvider implements TranscriptionProvider {
  name = "Groq";

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
    }
  ): Promise<Array<any & { chunkIndex: number }>> {
    // Use existing Groq client
    const { transcribeChunks } = require("./groq-client");
    return transcribeChunks(chunks, options);
  }
}

class HuggingFaceProvider implements TranscriptionProvider {
  name = "HuggingFace";
  private client: HFClient;

  constructor() {
    this.client = new HFClient();
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
    }
  ): Promise<Array<any & { chunkIndex: number }>> {
    return this.client.transcribeChunks(chunks, options);
  }
}

class OpenAIProvider implements TranscriptionProvider {
  name = "OpenAI";

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
    }
  ): Promise<Array<any & { chunkIndex: number }>> {
    // OpenAI implementation would go here
    throw new Error("OpenAI provider not yet implemented");
  }
}

class AssemblyAIProvider implements TranscriptionProvider {
  name = "AssemblyAI";

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
    }
  ): Promise<Array<any & { chunkIndex: number }>> {
    // AssemblyAI implementation would go here
    throw new Error("AssemblyAI provider not yet implemented");
  }
}

export async function transcribeWithFallback(
  chunks: AudioChunk[],
  options: {
    language?: string;
    prompt?: string;
    providers?: string[];
    onProgress?: (progress: {
      chunkIndex: number;
      totalChunks: number;
      status: "pending" | "processing" | "completed" | "failed";
      progress: number;
      error?: string;
      provider?: string;
    }) => void;
  } = {}
): Promise<{ results: any[]; provider: string }> {
  const providers = options.providers || ["huggingface", "groq"];
  const errors: { provider: string; error: Error }[] = [];

  for (const providerName of providers) {
    try {
      console.log(`🔄 Trying transcription provider: ${providerName}`);
      options.onProgress?.({
        chunkIndex: 0,
        totalChunks: chunks.length,
        status: "processing",
        progress: 0,
        provider: providerName,
      });

      const provider = TranscriptionProviderFactory.createProvider(providerName);
      const results = await provider.transcribeChunks(chunks, {
        language: options.language,
        prompt: options.prompt,
        onProgress: (progress) => {
          options.onProgress?.({
            ...progress,
            provider: providerName,
          });
        },
      });

      console.log(`✅ Transcription successful with provider: ${providerName}`);
      return { results, provider: providerName };
    } catch (error) {
      console.error(`❌ Provider ${providerName} failed:`, error);
      errors.push({ provider: providerName, error: error instanceof Error ? error : new Error(String(error)) });

      options.onProgress?.({
        chunkIndex: 0,
        totalChunks: chunks.length,
        status: "failed",
        progress: 0,
        error: error instanceof Error ? error.message : String(error),
        provider: providerName,
      });
    }
  }

  throw new Error(`All transcription providers failed. Errors: ${errors.map(e => `${e.provider}: ${e.error.message}`).join(", ")}`);
}
