import type { Term } from "@/types/database";
import { getAudioDuration, processAudioFile } from "./audio-processor";
import { DbUtils } from "./db";
import { handleError, handleSilently, notFoundError } from "./error-handler";

export interface TranscriptionOptions {
  language?: string;
  chunkSeconds?: number;
  overlap?: number;
  onProgress?: (progress: {
    progress: number;
    currentChunk: number;
    totalChunks: number;
  }) => void;
}

export interface TranscriptionResult {
  text: string;
  duration: number;
  segments: Array<{
    start: number;
    end: number;
    text: string;
    wordTimestamps?: Array<{
      word: string;
      start: number;
      end: number;
    }>;
  }>;
  segmentCount: number;
  processingTime: number;
}

export interface PostProcessOptions {
  targetLanguage?: string;
  enableAnnotations?: boolean;
  enableFurigana?: boolean;
  enableTerminology?: boolean;
}

export interface PostProcessResult {
  processedSegments: number;
  segments: Array<{
    start: number;
    end: number;
    text: string;
    normalizedText?: string;
    translation?: string;
    annotations?: string[];
    furigana?: string;
    wordTimestamps?: Array<{
      word: string;
      start: number;
      end: number;
    }>;
  }>;
}

/**
 * 转录音频文件
 */
export async function transcribeAudio(
  fileId: number,
  options: TranscriptionOptions = {},
): Promise<TranscriptionResult> {
  console.log(
    "🎵 TranscriptionService.transcribeAudio called with fileId:",
    fileId,
    "options:",
    options,
  );

  try {
    // 从客户端数据库获取文件数据
    const file = await DbUtils.getFile(fileId);
    if (!file) {
      console.error("❌ File not found in database for fileId:", fileId);
      throw notFoundError("文件未找到", { fileId });
    }
    console.log("✅ File found in database:", file.name, "size:", file.size);

    // 在客户端处理音频切片
    console.log("🔄 Processing audio file into chunks...");
    const chunks = await processAudioFile(
      file.blob,
      options.chunkSeconds || 45,
      options.overlap || 0.2,
    );
    console.log("✅ Audio processed into", chunks.length, "chunks");

    // 将音频块转换为可序列化的格式
    console.log("🔄 Converting chunks to serializable format...");
    const serializableChunks = await Promise.all(
      chunks.map(async (chunk) => ({
        arrayBuffer: {
          data: Array.from(new Uint8Array(await chunk.blob.arrayBuffer())),
        },
        startTime: chunk.startTime,
        endTime: chunk.endTime,
        duration: chunk.duration,
        index: chunk.index,
      })),
    );
    console.log("✅ Chunks converted to serializable format");

    // 清理音频块 blob 以释放内存
    console.log("🧹 Cleaning up audio chunk blobs...");
    chunks.forEach((chunk) => {
      if ("blob" in chunk && chunk.blob instanceof Blob) {
        // 清理 blob 内存
        URL.revokeObjectURL(URL.createObjectURL(chunk.blob));
      }
    });
    console.log("✅ Audio chunk blobs cleaned up");

    // 准备文件数据
    const fileArrayBuffer = await file.blob.arrayBuffer();
    const duration = await getAudioDuration(file.blob);
    console.log("📊 File duration:", duration, "seconds");

    // 调用 API 进行转录
    const requestData = {
      fileData: {
        arrayBuffer: {
          data: Array.from(new Uint8Array(fileArrayBuffer)),
        },
        name: file.name,
        size: file.size,
        type: file.type,
        duration: duration,
      },
      language: options.language || "ja",
      chunkSeconds: options.chunkSeconds || 45,
      overlap: options.overlap || 0.2,
      chunks: serializableChunks,
    };

    console.log("📡 Calling /api/transcribe API...");
    console.log("📦 Request data summary:", {
      fileName: requestData.fileData.name,
      fileSize: requestData.fileData.size,
      language: requestData.language,
      chunkCount: requestData.chunks.length,
    });

    const response = await fetch("/api/transcribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    console.log(
      "📡 API Response status:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ API Error response:", errorData);
      throw new Error(`转录失败: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    console.log("✅ API Response received:", result);

    if (!result.success) {
      console.error("❌ API returned unsuccessful result:", result);
      throw new Error(`转录失败: ${result.error || "未知错误"}`);
    }

    console.log("🎉 Transcription completed successfully");
    console.log("📊 Final result summary:", {
      textLength: result.data?.text?.length,
      segmentCount: result.data?.segments?.length,
      duration: result.data?.duration,
    });
    return result.data;
  } catch (error) {
    console.error("❌ Error in transcribeAudio:", error);
    throw handleError(error, "transcribeAudio");
  }
}

/**
 * 后处理转录结果
 */
export async function postProcessSegments(
  segments: Array<{
    start: number;
    end: number;
    text: string;
    wordTimestamps?: Array<{
      word: string;
      start: number;
      end: number;
    }>;
  }>,
  language: string = "ja",
  options: PostProcessOptions = {},
): Promise<PostProcessResult> {
  try {
    // 获取术语库（如果启用）
    let terminology: Term[] = [];
    if (options.enableTerminology) {
      try {
        terminology = await DbUtils.getAllTerms();
      } catch (error) {
        // 术语获取失败不影响主要处理流程，继续使用空术语列表
        handleSilently(error, "terminology-fetch");
      }
    }

    // 调用 API 进行后处理
    const requestData = {
      segments,
      language,
      targetLanguage: options.targetLanguage || "en",
      enableAnnotations: options.enableAnnotations !== false,
      enableFurigana: options.enableFurigana !== false,
      enableTerminology: options.enableTerminology !== false,
      terminology,
    };

    const response = await fetch("/api/postprocess", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`后处理失败: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(`后处理失败: ${result.error || "未知错误"}`);
    }

    return result.data;
  } catch (error) {
    throw handleError(error, "postProcessSegments");
  }
}

/**
 * 通过转录ID进行后处理
 */
export async function postProcessSegmentsByTranscriptId(
  transcriptId: number,
  options: PostProcessOptions = {},
): Promise<PostProcessResult> {
  try {
    // 获取转录记录
    const transcript = await DbUtils.getTranscript(transcriptId);
    if (!transcript) {
      throw notFoundError("Transcript not found", { transcriptId });
    }

    // 检查转录状态
    if (transcript.status !== "completed") {
      throw new Error("Transcript must be completed before post-processing");
    }

    // 获取转录的段落数据
    const segments = await DbUtils.getSegmentsByTranscriptId(transcriptId);

    // 调用后处理方法
    return await postProcessSegments(
      segments,
      transcript.language || "ja",
      options,
    );
  } catch (error) {
    throw handleError(error, "postProcessSegmentsByTranscriptId");
  }
}

/**
 * 完整的转录和后处理工作流
 */
export async function transcribeAndPostProcess(
  fileId: number,
  transcriptionOptions: TranscriptionOptions = {},
  postProcessOptions: PostProcessOptions = {},
): Promise<{
  transcription: TranscriptionResult;
  postProcessed: PostProcessResult;
}> {
  try {
    // 第一步：转录
    const transcription = await transcribeAudio(fileId, transcriptionOptions);

    // 第二步：后处理
    const postProcessed = await postProcessSegments(
      transcription.segments,
      transcriptionOptions.language || "ja",
      postProcessOptions,
    );

    return {
      transcription,
      postProcessed,
    };
  } catch (error) {
    throw handleError(error, "transcribeAndPostProcess");
  }
}

/**
 * 获取转录进度（对于兼容性）
 */
export async function getTranscriptionProgress(fileId: number) {
  try {
    const transcripts = await DbUtils.getTranscriptsByFileId(fileId);
    return {
      hasTranscript: transcripts.length > 0,
      isCompleted: transcripts.some((t) => t.status === "completed"),
      isProcessing: transcripts.some((t) => t.status === "processing"),
      transcripts,
    };
  } catch (error) {
    throw handleError(error, "getTranscriptionProgress");
  }
}

/**
 * 获取文件的转录记录
 */
export async function getFileTranscripts(fileId: number) {
  try {
    return await DbUtils.getTranscriptsByFileId(fileId);
  } catch (error) {
    throw handleError(error, "getFileTranscripts");
  }
}

/**
 * 保存转录结果到数据库
 */
export async function saveTranscriptionResult(
  fileId: number,
  transcriptionResult: TranscriptionResult,
  postProcessResult?: PostProcessResult,
): Promise<number> {
  try {
    // 创建转录记录
    const transcriptId = await DbUtils.addTranscript({
      fileId,
      status: "completed",
      language: "ja", // 从options中获取
      rawText: transcriptionResult.text,
      processingTime: transcriptionResult.processingTime,
    });

    // 保存段落数据
    const segments = postProcessResult
      ? postProcessResult.segments
      : transcriptionResult.segments;

    const segmentData = segments.map((segment) => ({
      transcriptId,
      start: segment.start,
      end: segment.end,
      text: segment.text,
      normalizedText:
        "normalizedText" in segment &&
        typeof segment.normalizedText === "string"
          ? segment.normalizedText
          : undefined,
      translation:
        "translation" in segment && typeof segment.translation === "string"
          ? segment.translation
          : undefined,
      annotations:
        "annotations" in segment && Array.isArray(segment.annotations)
          ? segment.annotations
          : undefined,
      furigana:
        "furigana" in segment && typeof segment.furigana === "string"
          ? segment.furigana
          : undefined,
      wordTimestamps: segment.wordTimestamps || [],
    }));

    await DbUtils.addSegments(segmentData);

    return transcriptId;
  } catch (error) {
    throw handleError(error, "saveTranscriptionResult");
  }
}

/**
 * 向后兼容的 TranscriptionService 类（保留旧API）
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Backward compatibility for existing code
export class TranscriptionService {
  static async transcribeAudio(
    fileId: number,
    options: TranscriptionOptions = {},
  ): Promise<TranscriptionResult> {
    return transcribeAudio(fileId, options);
  }

  static async postProcessSegments(
    segments: Array<{
      start: number;
      end: number;
      text: string;
      wordTimestamps?: Array<{
        word: string;
        start: number;
        end: number;
      }>;
    }>,
    language: string = "ja",
    options: PostProcessOptions = {},
  ): Promise<PostProcessResult> {
    return postProcessSegments(segments, language, options);
  }

  static async postProcessSegmentsByTranscriptId(
    transcriptId: number,
    options: PostProcessOptions = {},
  ): Promise<PostProcessResult> {
    return postProcessSegmentsByTranscriptId(transcriptId, options);
  }

  static async transcribeAndPostProcess(
    fileId: number,
    transcriptionOptions: TranscriptionOptions = {},
    postProcessOptions: PostProcessOptions = {},
  ): Promise<{
    transcription: TranscriptionResult;
    postProcessed: PostProcessResult;
  }> {
    return transcribeAndPostProcess(
      fileId,
      transcriptionOptions,
      postProcessOptions,
    );
  }

  static async getTranscriptionProgress(fileId: number) {
    return getTranscriptionProgress(fileId);
  }

  static async getFileTranscripts(fileId: number) {
    return getFileTranscripts(fileId);
  }

  static async saveTranscriptionResult(
    fileId: number,
    transcriptionResult: TranscriptionResult,
    postProcessResult?: PostProcessResult,
  ): Promise<number> {
    return saveTranscriptionResult(
      fileId,
      transcriptionResult,
      postProcessResult,
    );
  }
}
