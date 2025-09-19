import type { AudioChunk } from "./audio-processor";

export interface GroqTranscriptionRequest {
  file: Blob;
  model: "whisper-large-v3";
  language?: string;
  prompt?: string;
  responseFormat?: "json" | "text" | "srt" | "vtt" | "verbose_json";
  temperature?: number;
}

export interface GroqTranscriptionResponse {
  text: string;
  language?: string;
  duration?: number;
  segments?: TranscriptionSegment[];
}

export interface TranscriptionSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avgLogprob: number;
  compressionRatio: number;
  noSpeechProb: number;
}

// 为了向后兼容，保留类型别名
export type GroqSegment = TranscriptionSegment;

export interface GroqErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
  };
}

export interface TranscriptionProgress {
  chunkIndex: number;
  totalChunks: number;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  error?: string;
}

export type TranscriptionProgressCallback = (
  progress: TranscriptionProgress,
) => void;

export class GroqClientError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly type?: string,
  ) {
    super(message);
    this.name = "GroqClientError";
  }
}

export class GroqRateLimitError extends GroqClientError {
  constructor(
    message: string,
    public readonly retryAfter?: number,
  ) {
    super(message, 429, "rate_limit_exceeded");
    this.name = "GroqRateLimitError";
  }
}

// 模块级别的私有状态
const BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = "whisper-large-v3";
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds
const RATE_LIMIT_WINDOW = 60000; // 1 minute

let activeRequests = 0;
const maxConcurrency = parseInt(process.env.MAX_CONCURRENCY || "3", 10);
const rateLimitQueue: Array<() => Promise<void>> = [];
let lastRequestTime = 0;

/**
 * 构建表单数据
 */
function buildFormData(
  chunk: AudioChunk,
  options: { language?: string; prompt?: string },
): FormData {
  const formData = new FormData();
  formData.append("file", chunk.blob, `chunk_${chunk.index}.wav`);
  formData.append("model", DEFAULT_MODEL);

  if (options.language) {
    formData.append("language", options.language);
  }

  if (options.prompt) {
    formData.append("prompt", options.prompt);
  }

  formData.append("response_format", "verbose_json");
  return formData;
}

/**
 * 处理API响应错误
 */
async function handleResponseError(response: Response): Promise<never> {
  const errorData = (await response
    .json()
    .catch(() => ({}))) as GroqErrorResponse;

  if (response.status === 429) {
    const retryAfter = parseRetryAfter(response.headers.get("Retry-After"));
    throw new GroqRateLimitError(
      errorData.error?.message || "Rate limit exceeded",
      retryAfter,
    );
  }

  throw new GroqClientError(
    errorData.error?.message ||
      `HTTP ${response.status}: ${response.statusText}`,
    errorData.error?.code || response.status,
    errorData.error?.type,
  );
}

/**
 * 调整片段时间基于块开始时间
 */
function adjustSegmentTiming(
  segments: GroqSegment[],
  chunkStartTime: number,
): GroqSegment[] {
  return segments.map((segment) => ({
    ...segment,
    start: segment.start + chunkStartTime,
    end: segment.end + chunkStartTime,
  }));
}

/**
 * 处理转录错误与重试逻辑
 */
async function handleTranscriptionError(
  error: unknown,
  chunk: AudioChunk,
  options: { language?: string; prompt?: string; retryCount?: number },
): Promise<GroqTranscriptionResponse> {
  if (error instanceof GroqRateLimitError) {
    return handleRateLimitError(error, chunk, options);
  }

  const retryCount = options.retryCount || 0;
  if (retryCount < MAX_RETRIES && isRetryableError(error)) {
    const delay = calculateRetryDelay(retryCount);
    await delayMs(delay);
    return transcribeChunk(chunk, {
      ...options,
      retryCount: retryCount + 1,
    });
  }

  throw error;
}

/**
 * 使用Groq的Whisper API转录单个音频块
 */
export async function transcribeChunk(
  chunk: AudioChunk,
  options: {
    language?: string;
    prompt?: string;
    retryCount?: number;
  } = {},
): Promise<GroqTranscriptionResponse> {
  console.log(`🎤 transcribeChunk called for chunk ${chunk.index}`);
  const apiKey = process.env.GROQ_API_KEY;
  console.log(`🔑 GROQ_API_KEY: ${apiKey ? "已设置" : "未设置"}`);
  if (!apiKey) {
    throw new GroqClientError("GROQ_API_KEY environment variable is not set");
  }

  console.log(`⏳ Waiting for rate limit and concurrency slots...`);
  await waitForRateLimit();
  await waitForConcurrencySlot();
  console.log(`✅ Rate limit and concurrency slots acquired`);

  try {
    activeRequests++;
    lastRequestTime = Date.now();

    const formData = buildFormData(chunk, options);
    console.log(`📤 Sending chunk ${chunk.index} to Groq API...`);
    console.log(`🎵 Chunk details:`, {
      index: chunk.index,
      startTime: chunk.startTime,
      endTime: chunk.endTime,
      duration: chunk.duration,
      blobSize: chunk.blob.size,
    });

    console.log(`🌐 Calling Groq API at: ${BASE_URL}/audio/transcriptions`);
    const response = await fetch(`${BASE_URL}/audio/transcriptions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    console.log(
      `📡 API Response status: ${response.status} ${response.statusText}`,
    );

    if (!response.ok) {
      console.log(`❌ API request failed with status ${response.status}`);
      await handleResponseError(response);
    }

    const result = (await response.json()) as GroqTranscriptionResponse;
    console.log(`✅ Transcription successful for chunk ${chunk.index}:`, {
      textLength: result.text?.length,
      segmentCount: result.segments?.length,
      language: result.language,
    });

    // 添加时间信息到片段
    if (result.segments) {
      result.segments = adjustSegmentTiming(result.segments, chunk.startTime);
    }

    return result;
  } catch (error) {
    return handleTranscriptionError(error, chunk, options);
  } finally {
    activeRequests--;
    processRateLimitQueue();
  }
}

/**
 * 转录多个音频块，具有并发控制和进度跟踪
 */
export async function transcribeChunks(
  chunks: AudioChunk[],
  options: {
    language?: string;
    prompt?: string;
    onProgress?: TranscriptionProgressCallback;
  } = {},
): Promise<Array<GroqTranscriptionResponse & { chunkIndex: number }>> {
  console.log(`🎵 transcribeChunks called with ${chunks.length} chunks`);
  console.log(`🔧 Options:`, options);
  console.log(
    `📊 Current active requests: ${activeRequests}, max concurrency: ${maxConcurrency}`,
  );

  const results: Array<GroqTranscriptionResponse & { chunkIndex: number }> = [];
  const errors: Array<{ chunkIndex: number; error: Error }> = [];

  const processChunk = async (chunk: AudioChunk, index: number) => {
    console.log(`🔄 Processing chunk ${index} of ${chunks.length}`);
    try {
      options.onProgress?.({
        chunkIndex: index,
        totalChunks: chunks.length,
        status: "processing",
        progress: (index / chunks.length) * 100,
      });

      console.log(`📤 Calling transcribeChunk for chunk ${index}...`);
      const result = await transcribeChunk(chunk, {
        language: options.language,
        prompt: options.prompt,
      });
      console.log(`✅ Chunk ${index} transcribed successfully`);

      results.push({ ...result, chunkIndex: index });

      options.onProgress?.({
        chunkIndex: index,
        totalChunks: chunks.length,
        status: "completed",
        progress: ((index + 1) / chunks.length) * 100,
      });
    } catch (error) {
      console.error(`❌ Chunk ${index} failed:`, error);
      errors.push({
        chunkIndex: index,
        error: error instanceof Error ? error : new Error(String(error)),
      });

      options.onProgress?.({
        chunkIndex: index,
        totalChunks: chunks.length,
        status: "failed",
        progress: (index / chunks.length) * 100,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  // Process chunks with concurrency control
  const chunkPromises: Promise<void>[] = [];
  const processingQueue = [...chunks];

  while (processingQueue.length > 0) {
    const availableSlots = maxConcurrency - activeRequests;
    if (availableSlots > 0) {
      const chunk = processingQueue.shift();
      if (chunk) {
        const index = chunks.indexOf(chunk);
        chunkPromises.push(processChunk(chunk, index));
      }
    } else {
      await delayMs(100); // Wait for slots to become available
    }
  }

  await Promise.all(chunkPromises);

  if (errors.length > 0) {
    const errorMessage = errors
      .map((e) => `Chunk ${e.chunkIndex}: ${e.error.message}`)
      .join("; ");
    throw new GroqClientError(
      `Failed to transcribe ${errors.length} chunks: ${errorMessage}`,
    );
  }

  return results.sort((a, b) => a.chunkIndex - b.chunkIndex);
}

/**
 * 合并多个块的转录结果为单个响应
 */
export function mergeTranscriptionResults(
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
    language: results[0]?.language,
    duration:
      mergedSegments.length > 0
        ? Math.max(...mergedSegments.map((s) => s.end))
        : undefined,
    segments: mergedSegments.length > 0 ? mergedSegments : undefined,
  };
}

/**
 * 获取支持的音频格式和内容类型
 */
export function getSupportedFormats(): Array<{
  extension: string;
  mimeType: string;
  description: string;
}> {
  return [
    {
      extension: ".wav",
      mimeType: "audio/wav",
      description: "WAV audio format",
    },
    {
      extension: ".mp3",
      mimeType: "audio/mpeg",
      description: "MP3 audio format",
    },
    {
      extension: ".m4a",
      mimeType: "audio/mp4",
      description: "MP4 audio format",
    },
    {
      extension: ".webm",
      mimeType: "audio/webm",
      description: "WebM audio format",
    },
    {
      extension: ".ogg",
      mimeType: "audio/ogg",
      description: "Ogg Vorbis format",
    },
    {
      extension: ".flac",
      mimeType: "audio/flac",
      description: "FLAC audio format",
    },
  ];
}

/**
 * 验证blob是否为支持的格式
 */
export function isSupportedFormat(blob: Blob): boolean {
  const supportedTypes = getSupportedFormats().map((f) => f.mimeType);
  return supportedTypes.includes(blob.type);
}

/**
 * 如果需要，将音频blob转换为支持的格式
 */
export async function ensureSupportedFormat(blob: Blob): Promise<Blob> {
  if (isSupportedFormat(blob)) {
    return blob;
  }

  // For unsupported formats, we'll need to convert to WAV
  // This is a placeholder - in a real implementation, you'd use an audio conversion library
  throw new GroqClientError(
    `Unsupported audio format: ${blob.type}. ` +
      `Supported formats: ${getSupportedFormats()
        .map((f) => f.mimeType)
        .join(", ")}`,
  );
}

/**
 * 获取当前使用统计
 */
export function getUsageStats() {
  return {
    activeRequests,
    maxConcurrency,
    rateLimitQueueLength: rateLimitQueue.length,
    lastRequestTime,
  };
}

// 私有辅助函数
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_WINDOW / maxConcurrency) {
    const waitTime = RATE_LIMIT_WINDOW / maxConcurrency - timeSinceLastRequest;
    await delayMs(waitTime);
  }
}

async function waitForConcurrencySlot(): Promise<void> {
  while (activeRequests >= maxConcurrency) {
    await delayMs(100);
  }
}

async function handleRateLimitError(
  error: GroqRateLimitError,
  chunk: AudioChunk,
  options: { retryCount?: number; language?: string; prompt?: string },
): Promise<GroqTranscriptionResponse> {
  const retryCount = options.retryCount || 0;

  if (retryCount < MAX_RETRIES) {
    const delay = error.retryAfter || calculateRetryDelay(retryCount);
    await delayMs(delay);
    return transcribeChunk(chunk, {
      ...options,
      retryCount: retryCount + 1,
    });
  }

  throw error;
}

function isRetryableError(error: unknown): boolean {
  if (!(error instanceof GroqClientError)) {
    return false;
  }

  // Retry on network errors, rate limits, and server errors
  const retryableCodes = [429, 500, 502, 503, 504];
  return (
    retryableCodes.includes(error.code || 0) ||
    error.message.includes("network") ||
    error.message.includes("timeout")
  );
}

function calculateRetryDelay(retryCount: number): number {
  const baseDelay = INITIAL_RETRY_DELAY * 2 ** retryCount;
  const jitter = Math.random() * 1000; // Add jitter to avoid thundering herd
  return Math.min(baseDelay + jitter, MAX_RETRY_DELAY);
}

function parseRetryAfter(headerValue: string | null): number {
  if (!headerValue) {
    return INITIAL_RETRY_DELAY;
  }

  const value = parseInt(headerValue, 10);
  if (!Number.isNaN(value)) {
    return value * 1000; // Convert seconds to milliseconds
  }

  // Try to parse as HTTP date
  const date = new Date(headerValue);
  if (!Number.isNaN(date.getTime())) {
    return date.getTime() - Date.now();
  }

  return INITIAL_RETRY_DELAY;
}

async function delayMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function processRateLimitQueue(): void {
  if (rateLimitQueue.length > 0 && activeRequests < maxConcurrency) {
    const nextRequest = rateLimitQueue.shift();
    if (nextRequest) {
      nextRequest().catch((_error) => {
        // Log rate limit queue processing errors silently
      });
    }
  }
}
