import type { TranscriptRow } from '../types/database';
import type { AudioChunk } from './audio-processor';
import {
  type TranscriptionOptions,
  type TranscriptionResult,
  transcribeWithHuggingFace,
} from './huggingface-transcription';

export interface TranscriptionProgress {
  chunkIndex: number;
  totalChunks: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export interface TranscriptionServiceOptions extends TranscriptionOptions {
  onProgress?: (progress: TranscriptionProgress) => void;
}

/**
 * 转录音频文件
 */
export async function transcribeAudio(
  _fileId: number,
  chunksOrOptions: AudioChunk[] | TranscriptionServiceOptions,
  options?: TranscriptionServiceOptions
): Promise<TranscriptionResult> {
  // 支持两种调用方式：
  // 1. transcribeAudio(fileId, chunks, options)
  // 2. transcribeAudio(fileId, options) - 简化方式，用于页面组件
  let chunks: AudioChunk[];
  let finalOptions: TranscriptionServiceOptions;

  if (Array.isArray(chunksOrOptions)) {
    chunks = chunksOrOptions;
    finalOptions = options || {};
  } else {
    return {
      text: '',
      duration: 0,
      segments: [],
    };
  }

  // 调用 HuggingFace 进行转录
  const result = await transcribeWithHuggingFace(chunks, {
    language: finalOptions.language || 'ja',
    prompt: finalOptions.prompt,
    onProgress: (progress) => {
      finalOptions.onProgress?.({
        progress: progress.progress,
        chunkIndex: progress.chunkIndex,
        totalChunks: progress.totalChunks,
        status: progress.status,
        error: progress.error,
      });
    },
  });

  return {
    text: result.text || '',
    duration: result.duration || 0,
    segments: result.segments,
  };
}

/**
 * 获取文件转录进度
 */
export async function getTranscriptionProgress(fileId: number) {
  // 简化实现，返回基本状态
  return {
    fileId,
    status: 'processing' as const,
    progress: 0,
    message: '正在处理中...',
  };
}

/**
 * 获取文件转录记录
 */
export async function getFileTranscripts(_fileId: number): Promise<TranscriptRow[]> {
  // 简化实现，返回空数组
  return [];
}

// 导出为命名空间以兼容现有代码
export const TranscriptionService = {
  transcribeAudio,
  getTranscriptionProgress,
  getFileTranscripts,
};

// 重新导出类型以便其他模块使用
export type {
  TranscriptionOptions,
  TranscriptionResult,
} from './huggingface-transcription';
