export interface TranscriptionConfig {
  providers: string[];
  defaultProvider: string;
  timeoutMs: number;
  retryCount: number;
  maxConcurrency: number;
}

export const defaultConfig: TranscriptionConfig = {
  providers: ["huggingface", "groq"], // Try HuggingFace first, then Groq
  defaultProvider: "huggingface",
  timeoutMs: 5 * 60 * 1000, // 5 minutes
  retryCount: 3,
  maxConcurrency: 2,
};

export function getTranscriptionConfig(): TranscriptionConfig {
  // Allow override via environment variables
  return {
    providers: process.env.TRANSCRIPTION_PROVIDERS?.split(",") || defaultConfig.providers,
    defaultProvider: process.env.DEFAULT_TRANSCRIPTION_PROVIDER || defaultConfig.defaultProvider,
    timeoutMs: parseInt(process.env.TRANSCRIPTION_TIMEOUT_MS || defaultConfig.timeoutMs.toString()),
    retryCount: parseInt(process.env.TRANSCRIPTION_RETRY_COUNT || defaultConfig.retryCount.toString()),
    maxConcurrency: parseInt(process.env.TRANSCRIPTION_MAX_CONCURRENCY || defaultConfig.maxConcurrency.toString()),
  };
}

export function getProviderSettings(provider: string): {
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
        baseUrl: "https://api-inference.huggingface.co/models/openai/whisper-large-v3",
        model: "openai/whisper-large-v3",
        supportsLanguage: true,
        supportsPrompt: true,
        maxFileSize: 25 * 1024 * 1024, // 25MB
        maxDuration: 600, // 10 minutes
      };

    case "openai":
      return {
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: "https://api.openai.com/v1",
        model: "whisper-1",
        supportsLanguage: true,
        supportsPrompt: false,
        maxFileSize: 25 * 1024 * 1024, // 25MB
        maxDuration: 600, // 10 minutes
      };

    case "assemblyai":
      return {
        apiKey: process.env.ASSEMBLYAI_API_KEY,
        baseUrl: "https://api.assemblyai.com/v2",
        model: "whisper",
        supportsLanguage: true,
        supportsPrompt: false,
        maxFileSize: 100 * 1024 * 1024, // 100MB
        maxDuration: 3600, // 1 hour
      };

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export function isProviderAvailable(provider: string): boolean {
  const settings = getProviderSettings(provider);
  return !!settings.apiKey || provider.toLowerCase() === "huggingface"; // HuggingFace works without API key
}

export function getAvailableProviders(): string[] {
  const config = getTranscriptionConfig();
  return config.providers.filter(provider => isProviderAvailable(provider));
}
