export interface TranscriptionConfig {
  timeoutMs: number;
  retryCount: number;
  maxConcurrency: number;
}

export const defaultConfig: TranscriptionConfig = {
  timeoutMs: 5 * 60 * 1000, // 5 minutes
  retryCount: 3,
  maxConcurrency: 2,
};

export function getTranscriptionConfig(): TranscriptionConfig {
  // Allow override via environment variables
  return {
    timeoutMs: parseInt(
      process.env.TRANSCRIPTION_TIMEOUT_MS ||
        defaultConfig.timeoutMs.toString(),
    ),
    retryCount: parseInt(
      process.env.TRANSCRIPTION_RETRY_COUNT ||
        defaultConfig.retryCount.toString(),
    ),
    maxConcurrency: parseInt(
      process.env.TRANSCRIPTION_MAX_CONCURRENCY ||
        defaultConfig.maxConcurrency.toString(),
    ),
  };
}

export function getHuggingFaceSettings(): {
  apiKey?: string;
  baseUrl: string;
  model: string;
  supportsLanguage: boolean;
  supportsPrompt: boolean;
  maxFileSize: number;
  maxDuration: number;
} {
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
}

export function isHuggingFaceAvailable(): boolean {
  const settings = getHuggingFaceSettings();
  return true; // HuggingFace works without API key
}
