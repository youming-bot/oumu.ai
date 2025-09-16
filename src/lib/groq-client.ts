import { AudioChunk } from './audio-processor';

export interface GroqTranscriptionRequest {
  file: Blob;
  model: 'whisper-large-v3';
  language?: string;
  prompt?: string;
  response_format?: 'json' | 'text' | 'srt' | 'vtt' | 'verbose_json';
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
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

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
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export type TranscriptionProgressCallback = (progress: TranscriptionProgress) => void;

export class GroqClientError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly type?: string
  ) {
    super(message);
    this.name = 'GroqClientError';
  }
}

export class GroqRateLimitError extends GroqClientError {
  constructor(message: string, public readonly retryAfter?: number) {
    super(message, 429, 'rate_limit_exceeded');
    this.name = 'GroqRateLimitError';
  }
}

export class GroqTranscriptionClient {
  private static readonly BASE_URL = 'https://api.groq.com/openai/v1';
  private static readonly DEFAULT_MODEL = 'whisper-large-v3';
  private static readonly MAX_RETRIES = 3;
  private static readonly INITIAL_RETRY_DELAY = 1000; // 1 second
  private static readonly MAX_RETRY_DELAY = 30000; // 30 seconds
  private static readonly RATE_LIMIT_WINDOW = 60000; // 1 minute

  private static activeRequests = 0;
  private static maxConcurrency: number;
  private static rateLimitQueue: Array<() => Promise<void>> = [];
  private static lastRequestTime = 0;

  static {
    // Initialize concurrency from environment variable
    this.maxConcurrency = parseInt(process.env.MAX_CONCURRENCY || '3', 10);
  }

  /**
   * Transcribe a single audio chunk using Groq's Whisper API
   */
  static async transcribeChunk(
    chunk: AudioChunk,
    options: {
      language?: string;
      prompt?: string;
      retryCount?: number;
    } = {}
  ): Promise<GroqTranscriptionResponse> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new GroqClientError('GROQ_API_KEY environment variable is not set');
    }

    await this.waitForRateLimit();
    await this.waitForConcurrencySlot();

    try {
      this.activeRequests++;
      this.lastRequestTime = Date.now();

      const formData = new FormData();
      formData.append('file', chunk.blob, `chunk_${chunk.index}.wav`);
      formData.append('model', this.DEFAULT_MODEL);

      if (options.language) {
        formData.append('language', options.language);
      }

      if (options.prompt) {
        formData.append('prompt', options.prompt);
      }

      formData.append('response_format', 'verbose_json');

      const response = await fetch(`${this.BASE_URL}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as GroqErrorResponse;
        
        if (response.status === 429) {
          const retryAfter = this.parseRetryAfter(response.headers.get('Retry-After'));
          throw new GroqRateLimitError(
            errorData.error?.message || 'Rate limit exceeded',
            retryAfter
          );
        }

        throw new GroqClientError(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          errorData.error?.code || response.status,
          errorData.error?.type
        );
      }

      const result = await response.json() as GroqTranscriptionResponse;
      
      // Add timing information to segments
      if (result.segments) {
        result.segments = result.segments.map(segment => ({
          ...segment,
          start: segment.start + chunk.startTime,
          end: segment.end + chunk.startTime,
        }));
      }

      return result;

    } catch (error) {
      if (error instanceof GroqRateLimitError) {
        return this.handleRateLimitError(error, chunk, options);
      }

      const retryCount = options.retryCount || 0;
      if (retryCount < this.MAX_RETRIES && this.isRetryableError(error)) {
        const delay = this.calculateRetryDelay(retryCount);
        await this.delay(delay);
        return this.transcribeChunk(chunk, {
          ...options,
          retryCount: retryCount + 1,
        });
      }

      throw error;
    } finally {
      this.activeRequests--;
      this.processRateLimitQueue();
    }
  }

  /**
   * Transcribe multiple audio chunks with concurrency control and progress tracking
   */
  static async transcribeChunks(
    chunks: AudioChunk[],
    options: {
      language?: string;
      prompt?: string;
      onProgress?: TranscriptionProgressCallback;
    } = {}
  ): Promise<Array<GroqTranscriptionResponse & { chunkIndex: number }>> {
    const results: Array<GroqTranscriptionResponse & { chunkIndex: number }> = [];
    const errors: Array<{ chunkIndex: number; error: Error }> = [];

    const processChunk = async (chunk: AudioChunk, index: number) => {
      try {
        options.onProgress?.({
          chunkIndex: index,
          totalChunks: chunks.length,
          status: 'processing',
          progress: (index / chunks.length) * 100,
        });

        const result = await this.transcribeChunk(chunk, {
          language: options.language,
          prompt: options.prompt,
        });

        results.push({ ...result, chunkIndex: index });

        options.onProgress?.({
          chunkIndex: index,
          totalChunks: chunks.length,
          status: 'completed',
          progress: ((index + 1) / chunks.length) * 100,
        });

      } catch (error) {
        errors.push({
          chunkIndex: index,
          error: error instanceof Error ? error : new Error(String(error)),
        });

        options.onProgress?.({
          chunkIndex: index,
          totalChunks: chunks.length,
          status: 'failed',
          progress: (index / chunks.length) * 100,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    // Process chunks with concurrency control
    const chunkPromises: Promise<void>[] = [];
    const processingQueue = [...chunks];

    while (processingQueue.length > 0) {
      const availableSlots = this.maxConcurrency - this.activeRequests;
      if (availableSlots > 0) {
        const chunk = processingQueue.shift();
        if (chunk) {
          const index = chunks.indexOf(chunk);
          chunkPromises.push(processChunk(chunk, index));
        }
      } else {
        await this.delay(100); // Wait for slots to become available
      }
    }

    await Promise.all(chunkPromises);

    if (errors.length > 0) {
      const errorMessage = errors
        .map(e => `Chunk ${e.chunkIndex}: ${e.error.message}`)
        .join('; ');
      throw new GroqClientError(`Failed to transcribe ${errors.length} chunks: ${errorMessage}`);
    }

    return results.sort((a, b) => a.chunkIndex - b.chunkIndex);
  }

  /**
   * Merge transcription results from multiple chunks into a single response
   */
  static mergeTranscriptionResults(
    results: Array<GroqTranscriptionResponse & { chunkIndex: number }>
  ): GroqTranscriptionResponse {
    if (results.length === 0) {
      return { text: '', segments: [] };
    }

    const mergedText = results
      .map(result => result.text.trim())
      .filter(text => text.length > 0)
      .join(' ');

    const mergedSegments = results
      .flatMap(result => result.segments || [])
      .sort((a, b) => a.start - b.start);

    return {
      text: mergedText,
      language: results[0]?.language,
      duration: mergedSegments.length > 0 ? Math.max(...mergedSegments.map(s => s.end)) : undefined,
      segments: mergedSegments.length > 0 ? mergedSegments : undefined,
    };
  }

  /**
   * Get supported audio formats and content types
   */
  static getSupportedFormats(): Array<{
    extension: string;
    mimeType: string;
    description: string;
  }> {
    return [
      { extension: '.wav', mimeType: 'audio/wav', description: 'WAV audio format' },
      { extension: '.mp3', mimeType: 'audio/mpeg', description: 'MP3 audio format' },
      { extension: '.m4a', mimeType: 'audio/mp4', description: 'MP4 audio format' },
      { extension: '.webm', mimeType: 'audio/webm', description: 'WebM audio format' },
      { extension: '.ogg', mimeType: 'audio/ogg', description: 'Ogg Vorbis format' },
      { extension: '.flac', mimeType: 'audio/flac', description: 'FLAC audio format' },
    ];
  }

  /**
   * Validate if a blob is in a supported format
   */
  static isSupportedFormat(blob: Blob): boolean {
    const supportedTypes = this.getSupportedFormats().map(f => f.mimeType);
    return supportedTypes.includes(blob.type);
  }

  /**
   * Convert audio blob to a supported format if needed
   */
  static async ensureSupportedFormat(blob: Blob): Promise<Blob> {
    if (this.isSupportedFormat(blob)) {
      return blob;
    }

    // For unsupported formats, we'll need to convert to WAV
    // This is a placeholder - in a real implementation, you'd use an audio conversion library
    throw new GroqClientError(
      `Unsupported audio format: ${blob.type}. ` +
      `Supported formats: ${this.getSupportedFormats().map(f => f.mimeType).join(', ')}`
    );
  }

  private static async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.RATE_LIMIT_WINDOW / this.maxConcurrency) {
      const waitTime = (this.RATE_LIMIT_WINDOW / this.maxConcurrency) - timeSinceLastRequest;
      await this.delay(waitTime);
    }
  }

  private static async waitForConcurrencySlot(): Promise<void> {
    while (this.activeRequests >= this.maxConcurrency) {
      await this.delay(100);
    }
  }

  private static async handleRateLimitError(
    error: GroqRateLimitError,
    chunk: AudioChunk,
    options: { retryCount?: number; language?: string; prompt?: string }
  ): Promise<GroqTranscriptionResponse> {
    const retryCount = options.retryCount || 0;
    
    if (retryCount < this.MAX_RETRIES) {
      const delay = error.retryAfter || this.calculateRetryDelay(retryCount);
      await this.delay(delay);
      return this.transcribeChunk(chunk, {
        ...options,
        retryCount: retryCount + 1,
      });
    }

    throw error;
  }

  private static isRetryableError(error: unknown): boolean {
    if (!(error instanceof GroqClientError)) {
      return false;
    }

    // Retry on network errors, rate limits, and server errors
    const retryableCodes = [429, 500, 502, 503, 504];
    return retryableCodes.includes(error.code || 0) || 
           error.message.includes('network') ||
           error.message.includes('timeout');
  }

  private static calculateRetryDelay(retryCount: number): number {
    const baseDelay = this.INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
    const jitter = Math.random() * 1000; // Add jitter to avoid thundering herd
    return Math.min(baseDelay + jitter, this.MAX_RETRY_DELAY);
  }

  private static parseRetryAfter(headerValue: string | null): number {
    if (!headerValue) {
      return this.INITIAL_RETRY_DELAY;
    }

    const value = parseInt(headerValue, 10);
    if (!isNaN(value)) {
      return value * 1000; // Convert seconds to milliseconds
    }

    // Try to parse as HTTP date
    const date = new Date(headerValue);
    if (!isNaN(date.getTime())) {
      return date.getTime() - Date.now();
    }

    return this.INITIAL_RETRY_DELAY;
  }

  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static processRateLimitQueue(): void {
    if (this.rateLimitQueue.length > 0 && this.activeRequests < this.maxConcurrency) {
      const nextRequest = this.rateLimitQueue.shift();
      if (nextRequest) {
        nextRequest().catch(console.error);
      }
    }
  }

  /**
   * Get current usage statistics
   */
  static getUsageStats() {
    return {
      activeRequests: this.activeRequests,
      maxConcurrency: this.maxConcurrency,
      rateLimitQueueLength: this.rateLimitQueue.length,
      lastRequestTime: this.lastRequestTime,
    };
  }
}