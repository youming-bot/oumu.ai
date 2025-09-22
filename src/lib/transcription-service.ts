import { type AudioChunk, processAudioFile } from './audio-processor';

export interface TranscriptionOptions {
  language?: string;
  prompt?: string;
  onProgress?: (progress: {
    chunkIndex: number;
    totalChunks: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    message?: string;
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

export interface TranscriptionProgress {
  fileId: number;
  status: 'idle' | 'processing' | 'completed' | 'error' | 'failed';
  progress: number;
  message: string;
}

/**
 * 转录音频文件
 */
export async function transcribeAudio(
  fileId: number,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  const startTime = Date.now();

  try {
    // 初始化服务器端进度
    const { setServerProgress } = await import('./server-progress');
    setServerProgress(fileId, {
      status: 'processing',
      progress: 0,
      message: 'Processing audio chunks...',
    });

    // 通知进度回调
    if (options.onProgress) {
      options.onProgress({
        chunkIndex: 0,
        totalChunks: 1,
        status: 'processing',
        progress: 10,
        message: 'Starting transcription...',
      });
    }

    // 获取音频chunks
    const chunks = await processAudioFile(fileId, 45, 0.2);

    if (options.onProgress) {
      options.onProgress({
        chunkIndex: 0,
        totalChunks: chunks.length,
        status: 'processing',
        progress: 30,
        message: `Audio split into ${chunks.length} chunks`,
      });
    }

    // 使用服务器端 API 路由进行转录（现在使用 Groq）
    setServerProgress(fileId, {
      status: 'processing',
      progress: 50,
      message: 'Transcribing audio...',
    });

    const result = await transcribeViaApiRoute(chunks, options);

    if (options.onProgress) {
      options.onProgress({
        chunkIndex: chunks.length,
        totalChunks: chunks.length,
        status: 'completed',
        progress: 90,
        message: 'Saving results...',
      });
    }

    // 保存转录结果到数据库
    const { db } = await import('./db');

    // 先保存转录记录
    const transcriptId = await db.transcripts.add({
      fileId,
      status: 'completed',
      rawText: result.text,
      language: result.language || options.language || 'ja',
      processingTime: Date.now() - startTime,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 如果有 segments 数据，保存到 segments 表
    if (result.segments && result.segments.length > 0) {
      const now = new Date();
      const segmentsToSave = result.segments.map((segment, _index) => ({
        transcriptId,
        start: segment.start,
        end: segment.end,
        text: segment.text,
        createdAt: now,
        updatedAt: now,
      }));

      await db.segments.bulkAdd(segmentsToSave);
    }

    // 标记转录完成，开始后处理
    setServerProgress(fileId, {
      status: 'completed',
      progress: 95,
      message: '转录完成，正在后处理...',
    });

    if (options.onProgress) {
      options.onProgress({
        chunkIndex: chunks.length,
        totalChunks: chunks.length,
        status: 'completed',
        progress: 95,
        message: '转录完成，正在后处理...',
      });
    }

    // 自动调用后处理 API
    try {
      if (result.segments && result.segments.length > 0) {
        const response = await fetch('/api/postprocess', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            segments: result.segments,
            language: result.language || 'ja',
            targetLanguage: 'zh',
            enableAnnotations: true,
            enableFurigana: true,
            enableTerminology: true,
          }),
        });

        if (response.ok) {
          const postProcessResult = await response.json();
          if (postProcessResult.success) {
            // 更新 segments 表中的后处理数据
            const { db } = await import('./db');

            for (const processedSegment of postProcessResult.data.segments) {
              await db.segments
                .where('transcriptId')
                .equals(transcriptId)
                .and(
                  (segment) =>
                    segment.start === processedSegment.start && segment.end === processedSegment.end
                )
                .modify({
                  normalizedText: processedSegment.normalizedText,
                  translation: processedSegment.translation,
                  annotations: processedSegment.annotations,
                  furigana: processedSegment.furigana,
                });
            }
          }
        }
      }
    } catch (_error) {
      // 后处理失败不影响主要转录流程
    }

    // 最终标记为完全完成
    setServerProgress(fileId, {
      status: 'completed',
      progress: 100,
      message: '处理完成',
    });

    if (options.onProgress) {
      options.onProgress({
        chunkIndex: chunks.length,
        totalChunks: chunks.length,
        status: 'completed',
        progress: 100,
        message: '处理完成',
      });
    }

    return result;
  } catch (error) {
    // 标记为失败
    const { setServerProgress } = await import('./server-progress');
    setServerProgress(fileId, {
      status: 'failed',
      progress: 0,
      message: 'Transcription failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

async function transcribeViaApiRoute(
  chunks: AudioChunk[],
  options: TranscriptionOptions
): Promise<TranscriptionResult> {
  // 使用FormData格式发送音频数据
  const formData = new FormData();

  // 添加元数据
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('language', options.language || 'ja');
  formData.append('response_format', 'verbose_json');
  formData.append('temperature', '0');

  // 合并所有音频块为一个文件（Groq API期望单个音频文件）
  const { mergeAudioChunks } = await import('./audio-processor');
  const mergedAudio = await mergeAudioChunks(chunks);

  // 创建文件名
  const fileName = `audio_${Date.now()}.wav`;
  const audioFile = new File([mergedAudio], fileName, { type: 'audio/wav' });

  formData.append('file', audioFile);

  // 调用服务器端 API
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error?.message || 'Transcription failed');
  }

  const payload = result.data ?? result;

  interface Segment {
    id?: number;
    seek?: number;
    start: number;
    end: number;
    text: string;
    tokens?: number[];
    temperature?: number;
    avgLogprob?: number;
    compressionRatio?: number;
    noSpeechProb?: number;
  }

  interface ChunkResult {
    success: boolean;
    result?: {
      text?: string;
      segments?: Segment[];
    };
  }

  if (payload?.text) {
    const segments = Array.isArray(payload.segments)
      ? payload.segments.map((segment: Segment, index: number) => ({
          ...segment,
          id: segment.id ?? index + 1,
        }))
      : [];

    return {
      text: payload.text,
      language: payload.language || options.language || 'ja',
      duration: payload.duration ?? payload.file?.duration,
      segments: segments.length > 0 ? segments : undefined,
    };
  }

  if (Array.isArray(payload?.results) && payload.results.length > 0) {
    const mergedText = payload.results
      .filter((r: ChunkResult) => r.success && r.result?.text)
      .map((r: ChunkResult) => r.result?.text || '')
      .filter(Boolean)
      .join(' ');

    const mergedSegments = payload.results
      .filter((r: ChunkResult) => r.success && r.result?.segments)
      .flatMap((r: ChunkResult) => r.result?.segments || [])
      .map((segment: Segment, index: number) => ({
        ...segment,
        id: index + 1,
      }));

    return {
      text: mergedText,
      language: options.language || 'ja',
      duration: payload.fileData?.duration,
      segments: mergedSegments.length > 0 ? mergedSegments : undefined,
    };
  }

  throw new Error('No valid transcription results found');
}

/**
 * 获取文件转录进度
 */
export async function getTranscriptionProgress(fileId: number): Promise<TranscriptionProgress> {
  try {
    const { db } = await import('./db');

    const transcripts = await db.transcripts.where('fileId').equals(fileId).toArray();

    const processingTranscript = transcripts.find((t) => t.status === 'processing');

    if (!processingTranscript) {
      // 如果没有正在处理的转录，检查是否有完成的转录
      const completedTranscript = transcripts.find((t) => t.status === 'completed');
      if (completedTranscript) {
        return {
          fileId,
          status: 'completed' as const,
          progress: 100,
          message: '转录完成',
        };
      }

      return {
        fileId,
        status: 'idle' as const,
        progress: 0,
        message: '未开始转录',
      };
    }

    // 模拟进度计算（实际应用中应该从转录服务获取真实进度）
    const processingTime = Date.now() - processingTranscript.createdAt.getTime();
    const estimatedProgress = Math.min(95, Math.floor(processingTime / 1000)); // 假设每秒5%进度，最大95%

    return {
      fileId,
      status: 'processing' as const,
      progress: estimatedProgress,
      message: '正在转录中...',
    };
  } catch (_error) {
    return {
      fileId,
      status: 'error' as const,
      progress: 0,
      message: '获取进度失败',
    };
  }
}
export async function getFileTranscripts(fileId: number) {
  const { db } = await import('./db');
  return await db.transcripts.where('fileId').equals(fileId).toArray();
}

export const TranscriptionService = {
  transcribeAudio,
  getTranscriptionProgress,
  getFileTranscripts,
};
