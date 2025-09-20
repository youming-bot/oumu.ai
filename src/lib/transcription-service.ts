import { HFClienttranscribeWithHuggingFace.huggingface-transcriptiontype AudioChunk } from "./hf-client";

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

     const { DbUtils } = await import("./db");
new Error    const { processAudioFile } = await import("./audio-processor");
    // 转换为可序列化的格式
    const serializableChunks = chunks.map((chunk) => ({
      blob: chunk.blob,
      startTime: chunk.startTime,
      endTime: chunk.endTime,
      duration: chunk.duration,
      index: chunk.index,
    // 调用 HuggingFace 进行转录
    console.log("📡 Calling HuggingFace transcription...");
    const result = await transcribeWithHuggingFace(serializableChunks, {
      language: options.language || "ja",
      onProgress: (progress) => {
        console.log("📊 Transcription progress:", progress);
        options.onProgress?.({
          progress: progress.progress,
          currentChunk: progress.chunkIndex,
          totalChunks: progress.totalChunks,
        });
      },
    });
console.log("🎉 Transcription completed successfully");
    {
      text: result.text || "",
      duration: result.duration || 0,
      segments: result.segments,
      segmentCount: result.segments?.length || 0,
      processingTime: 0,
    }console.("❌ Error in transcribeAudio:"error;
    throw error获取文件转录进度简化版本export async function getTranscriptionProgress(fileId: number) {
  // 简化实现，返回基本状态
  return {
    fileId,
    status: "processing" as const,
    progress: 0,
    message: "正在处理中...",
  };
}

/**
 * 获取文件转录记录（简化版本）
 */
export async function getFileTranscripts(fileId: number) {
  // 简化实现，返回空数组
  return [];
}

// 导出为命名空间以兼容现有代码
export const TranscriptionService = {
  transcribeAudio,
  getTranscriptionProgress,
  getFileTranscripts,
};
