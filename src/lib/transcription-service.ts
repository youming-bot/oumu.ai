import { TranscriptRow, Segment } from '@/types/database';
import { DBUtils } from './db';

export interface TranscriptionOptions {
  language?: string;
  chunkSeconds?: number;
  overlap?: number;
  onProgress?: (progress: TranscriptionProgress) => void;
}

export interface TranscriptionProgress {
  fileId: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentChunk?: number;
  totalChunks?: number;
  error?: string;
  transcriptId?: number;
  estimatedTimeRemaining?: number;
}

export class TranscriptionService {
  private static activeTranscriptions = new Map<number, TranscriptionProgress>();

  static async transcribeAudio(
    fileId: number,
    options: TranscriptionOptions = {}
  ): Promise<number> {
    try {
      const file = await DBUtils.getFile(fileId);
      if (!file) {
        throw new Error('File not found');
      }

      // Check if there's already a completed transcript
      const existingTranscripts = await DBUtils.getTranscriptsByFileId(fileId);
      const completedTranscript = existingTranscripts.find(t => t.status === 'completed');
      
      if (completedTranscript && completedTranscript.id) {
        console.log('File already has a completed transcription');
        return completedTranscript.id;
      }

      // Create a new transcript record
      const transcriptId = await DBUtils.addTranscript({
        fileId,
        status: 'processing',
        language: options.language || 'ja',
      });

      // Start transcription process
      this.startTranscriptionProcess(fileId, transcriptId, options);

      return transcriptId;

    } catch (error) {
      console.error('Failed to start transcription:', error);
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async startTranscriptionProcess(
    fileId: number,
    transcriptId: number,
    options: TranscriptionOptions
  ) {
    try {
      // Update progress
      this.updateProgress(fileId, {
        status: 'processing',
        progress: 0,
        transcriptId,
      }, options);

      // Call the transcription API
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId,
          language: options.language || 'ja',
          chunkSeconds: options.chunkSeconds || 45,
          overlap: options.overlap || 0.2,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Transcription failed');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Transcription failed');
      }

      // Update progress to completed
      this.updateProgress(fileId, {
        status: 'completed',
        progress: 100,
      }, options);

      console.log(`Transcription completed for file ${fileId}: ${result.text.length} characters`);

    } catch (error) {
      console.error('Transcription process failed:', error);
      
      // Update transcript status to failed
      await DBUtils.updateTranscript(transcriptId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      this.updateProgress(fileId, {
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, options);
    }
  }

  static async postProcessTranscript(
    transcriptId: number,
    options: {
      targetLanguage?: string;
      enableAnnotations?: boolean;
      enableFurigana?: boolean;
      enableTerminology?: boolean;
    } = {}
  ): Promise<void> {
    try {
      const transcript = await DBUtils.getTranscript(transcriptId);
      if (!transcript) {
        throw new Error('Transcript not found');
      }

      if (transcript.status !== 'completed') {
        throw new Error('Transcript must be completed before post-processing');
      }

      // Call the post-processing API
      const response = await fetch('/api/postprocess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcriptId,
          targetLanguage: options.targetLanguage || 'en',
          enableAnnotations: options.enableAnnotations ?? true,
          enableFurigana: options.enableFurigana ?? true,
          enableTerminology: options.enableTerminology ?? true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Post-processing failed');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Post-processing failed');
      }

      console.log(`Post-processing completed for transcript ${transcriptId}`);

    } catch (error) {
      console.error('Post-processing failed:', error);
      throw new Error(`Post-processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getTranscriptWithSegments(transcriptId: number): Promise<{
    transcript: TranscriptRow;
    segments: Segment[];
  }> {
    try {
      return await DBUtils.getTranscriptWithSegments(transcriptId);
    } catch (error) {
      console.error('Failed to get transcript with segments:', error);
      throw error;
    }
  }

  static async getFileTranscripts(fileId: number): Promise<TranscriptRow[]> {
    try {
      return await DBUtils.getTranscriptsByFileId(fileId);
    } catch (error) {
      console.error('Failed to get file transcripts:', error);
      throw error;
    }
  }

  static getTranscriptionProgress(fileId: number): TranscriptionProgress | undefined {
    return this.activeTranscriptions.get(fileId);
  }

  private static updateProgress(fileId: number, progress: Partial<TranscriptionProgress>, options?: TranscriptionOptions) {
    const currentProgress = this.activeTranscriptions.get(fileId) || {
      fileId,
      status: 'pending',
      progress: 0,
    };

    const newProgress = { ...currentProgress, ...progress };
    this.activeTranscriptions.set(fileId, newProgress);

    // Notify listeners via callback
    if (options?.onProgress) {
      options.onProgress(newProgress);
    }
  }

  static clearProgress(fileId: number) {
    this.activeTranscriptions.delete(fileId);
  }

  static async transcribeAndProcess(
    fileId: number,
    transcriptionOptions?: TranscriptionOptions,
    postProcessOptions?: {
      targetLanguage?: string;
      enableAnnotations?: boolean;
      enableFurigana?: boolean;
      enableTerminology?: boolean;
    }
  ): Promise<number> {
    try {
      // Start transcription
      const transcriptId = await this.transcribeAudio(fileId, transcriptionOptions);

      // Wait for transcription to complete (simplified - in real app would use proper async handling)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Start post-processing
      await this.postProcessTranscript(transcriptId, postProcessOptions);

      return transcriptId;

    } catch (error) {
      console.error('Transcription and processing failed:', error);
      throw error;
    }
  }
}