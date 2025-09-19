import { FileUploadUtils } from "./file-upload";
import { createObjectUrl, revokeObjectUrl } from "./url-manager";

export interface AudioChunk {
  blob: Blob;
  startTime: number;
  endTime: number;
  duration: number;
  index: number;
}

export interface AudioMetadata {
  duration: number;
  sampleRate: number;
  channels: number;
  bitrate: number;
}

/**
 * 获取音频持续时间
 */
export async function getAudioDuration(blob: Blob): Promise<number> {
  console.log("⏱️ getAudioDuration called with blob size:", blob.size);

  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = createObjectUrl(blob);
    console.log("🔗 Created object URL for audio:", url);

    audio.addEventListener("loadedmetadata", () => {
      const duration = audio.duration;
      console.log("✅ Audio metadata loaded, duration:", duration);
      revokeObjectUrl(url);
      resolve(duration);
    });

    audio.addEventListener("error", (error) => {
      console.error("❌ Audio loading error:", error);
      revokeObjectUrl(url);
      reject(new Error("Failed to load audio metadata"));
    });

    audio.src = url;
  });
}

/**
 * 切割音频为块
 */
export async function sliceAudio(
  blob: Blob,
  startTime: number,
  endTime: number,
  chunkSeconds: number = 45,
  overlap: number = 0.2,
): Promise<AudioChunk[]> {
  console.log("🔪 sliceAudio called with:", {
    startTime,
    endTime,
    chunkSeconds,
    overlap,
    blobSize: blob.size,
  });

  // 内存安全检查
  if (blob.size > 500 * 1024 * 1024) {
    // 500MB limit
    throw new Error(
      "Audio file too large for processing. Maximum size is 500MB.",
    );
  }

  const audioContext = new AudioContext();
  console.log("🎵 AudioContext created");

  try {
    console.log("📦 Converting blob to arrayBuffer...");
    const arrayBuffer = await blob.arrayBuffer();
    console.log("✅ ArrayBuffer created, size:", arrayBuffer.byteLength);

    console.log("🎼 Decoding audio data...");
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    console.log(
      "✅ Audio data decoded, duration:",
      audioBuffer.duration,
      "sampleRate:",
      audioBuffer.sampleRate,
    );

    const chunks: AudioChunk[] = [];

    let currentStart = startTime;
    let chunkIndex = 0;
    const MAX_CHUNKS = 100; // 限制最大块数量防止内存泄漏

    console.log("🔄 Starting chunk creation loop...");
    while (currentStart < endTime && chunkIndex < MAX_CHUNKS) {
      const chunkEnd = Math.min(currentStart + chunkSeconds, endTime);
      const chunkDuration = chunkEnd - currentStart;

      console.log(`🔪 Creating chunk ${chunkIndex}:`, {
        start: currentStart.toFixed(2),
        end: chunkEnd.toFixed(2),
        duration: chunkDuration.toFixed(2),
      });

      if (chunkDuration <= 0) {
        console.log("⚠️ Chunk duration <= 0, breaking loop");
        break;
      }

      console.log(`📤 Extracting audio segment for chunk ${chunkIndex}...`);

      // 添加一个简单的测试来确认代码执行
      console.log(`🧪 TEST: Before try block for chunk ${chunkIndex}`);

      let chunkBlob: Blob;
      try {
        console.log(
          `🧪 Processing chunk ${chunkIndex} with actual audio extraction...`,
        );

        // 使用实际的音频提取函数
        chunkBlob = await extractAudioSegment(
          audioBuffer,
          currentStart,
          chunkEnd,
          audioContext,
        );

        console.log(
          `✅ Chunk ${chunkIndex} extracted successfully, size:`,
          chunkBlob.size,
        );
      } catch (extractError) {
        console.error(`❌ Error extracting chunk ${chunkIndex}:`, extractError);
        console.error("Error details:", {
          name: extractError instanceof Error ? extractError.name : "Unknown",
          message:
            extractError instanceof Error
              ? extractError.message
              : "Unknown error",
          stack:
            extractError instanceof Error
              ? extractError.stack
              : "No stack trace",
        });
        throw extractError;
      }

      chunks.push({
        blob: chunkBlob,
        startTime: currentStart,
        endTime: chunkEnd,
        duration: chunkDuration,
        index: chunkIndex,
      });

      currentStart = chunkEnd - overlap;
      chunkIndex++;
    }

    // 检查是否因为达到最大块数而停止
    if (chunkIndex >= MAX_CHUNKS) {
      console.warn(
        `⚠️ Stopped chunk creation at maximum limit of ${MAX_CHUNKS} chunks to prevent memory issues`,
      );
    }

    console.log(
      "🎉 Chunk creation loop completed, total chunks:",
      chunks.length,
    );

    return chunks;
  } catch (error) {
    console.error("❌ Error in sliceAudio:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
    });
    throw new Error(
      `Audio processing error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  } finally {
    console.log("🔄 Closing AudioContext...");
    await audioContext.close();
    console.log("✅ AudioContext closed");
  }
}

/**
 * 提取音频段
 */
async function extractAudioSegment(
  audioBuffer: AudioBuffer,
  startTime: number,
  endTime: number,
  _audioContext: AudioContext,
): Promise<Blob> {
  console.log("🎛️ EXTRACT AUDIO SEGMENT - FUNCTION START");
  console.log("🎛️ extractAudioSegment called:", {
    startTime,
    endTime,
    audioBufferDuration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    numberOfChannels: audioBuffer.numberOfChannels,
  });

  const sampleRate = audioBuffer.sampleRate;
  const startSample = Math.floor(startTime * sampleRate);
  const endSample = Math.floor(endTime * sampleRate);
  const frameCount = endSample - startSample;

  console.log("📊 Audio segment details:", {
    sampleRate,
    startSample,
    endSample,
    frameCount,
    duration: (endSample - startSample) / sampleRate,
  });

  const numberOfChannels = audioBuffer.numberOfChannels;
  console.log("🎚️ Creating OfflineAudioContext with:", {
    numberOfChannels,
    frameCount,
    sampleRate,
  });

  const offlineContext = new OfflineAudioContext(
    numberOfChannels,
    frameCount,
    sampleRate,
  );
  console.log("✅ OfflineAudioContext created");

  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  console.log("✅ BufferSource created");

  const destination = offlineContext.createGain();
  source.connect(destination);
  destination.connect(offlineContext.destination);
  console.log("✅ Audio graph connected");

  source.start(0, startTime, endTime - startTime);
  console.log("🎵 Audio source started with parameters:", {
    offset: startTime,
    duration: endTime - startTime,
  });

  console.log("🎬 Starting offline rendering...");
  try {
    const renderedBuffer = await offlineContext.startRendering();
    console.log("✅ Offline rendering completed");
    console.log("📊 Rendered buffer info:", {
      duration: renderedBuffer.duration,
      sampleRate: renderedBuffer.sampleRate,
      numberOfChannels: renderedBuffer.numberOfChannels,
      length: renderedBuffer.length,
    });

    console.log("🔄 Interleaving audio channels...");
    const interleaved = interleave(renderedBuffer);
    console.log("✅ Audio interleaved, length:", interleaved.length);

    console.log("📦 Encoding to WAV format...");
    const wavBlob = encodeWav(interleaved, renderedBuffer.sampleRate);
    console.log("✅ WAV encoding completed, blob size:", wavBlob.size);

    return wavBlob;
  } catch (renderError) {
    console.error("❌ Error during offline rendering:", renderError);
    throw renderError;
  }
}

/**
 * 交错音频通道
 */
function interleave(buffer: AudioBuffer): Float32Array {
  const numberOfChannels = buffer.numberOfChannels;
  const length = buffer.length * numberOfChannels;
  const result = new Float32Array(length);

  for (let channel = 0; channel < numberOfChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < buffer.length; i++) {
      result[i * numberOfChannels + channel] = channelData[i];
    }
  }

  return result;
}

/**
 * 编码WAV格式
 */
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const floatTo16BitPcm = (
    output: DataView,
    offset: number,
    input: Float32Array,
  ) => {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);
  floatTo16BitPcm(view, 44, samples);

  return new Blob([view], { type: "audio/wav" });
}

/**
 * 处理音频文件
 */
export async function processAudioFile(
  fileBlobOrId: Blob | number,
  chunkSeconds: number = 45,
  overlap: number = 0.2,
): Promise<AudioChunk[]> {
  console.log("🔄 processAudioFile called with:", {
    fileBlobOrId:
      typeof fileBlobOrId === "number"
        ? `fileId: ${fileBlobOrId}`
        : "direct blob",
    chunkSeconds,
    overlap,
  });

  let fileBlob: Blob;

  // 如果传入的是数字，说明是文件ID，需要获取文件blob
  if (typeof fileBlobOrId === "number") {
    console.log("📁 Getting blob from file ID:", fileBlobOrId);
    fileBlob = await FileUploadUtils.getFileBlob(fileBlobOrId);
    console.log("✅ Blob retrieved from file ID, size:", fileBlob.size);
  } else {
    fileBlob = fileBlobOrId;
    console.log("✅ Using direct blob, size:", fileBlob.size);
  }

  console.log("🎵 Getting audio duration...");
  const duration = await getAudioDuration(fileBlob);
  console.log("✅ Audio duration:", duration, "seconds");

  // 文件大小和时长检查
  if (fileBlob.size > 500 * 1024 * 1024) {
    throw new Error(
      "File size exceeds 500MB limit. Please use a smaller audio file.",
    );
  }

  if (duration > 3600) {
    // 1小时限制
    throw new Error(
      "Audio duration exceeds 1 hour limit. Please use a shorter audio file.",
    );
  }

  console.log("🔪 Slicing audio into chunks...");
  const chunks = await sliceAudio(fileBlob, 0, duration, chunkSeconds, overlap);
  console.log("✅ Audio sliced into", chunks.length, "chunks");

  // 如果传入的是文件ID，更新文件元数据
  if (typeof fileBlobOrId === "number") {
    console.log("📝 Updating file metadata with duration...");
    await FileUploadUtils.updateFileMetadata(fileBlobOrId, { duration });
    console.log("✅ File metadata updated");
  }

  console.log("🎉 Audio processing completed");
  return chunks;
}

/**
 * 获取音频元数据
 */
export async function getAudioMetadata(blob: Blob): Promise<AudioMetadata> {
  const audioContext = new AudioContext();
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  await audioContext.close();

  return {
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    channels: audioBuffer.numberOfChannels,
    bitrate: Math.round((blob.size * 8) / audioBuffer.duration),
  };
}

/**
 * 合并音频块
 */
export async function mergeAudioChunks(chunks: AudioChunk[]): Promise<Blob> {
  if (chunks.length === 0) {
    throw new Error("No chunks to merge");
  }
  const audioContext = new AudioContext();
  const sampleRate = 44100; // Standard sample rate

  const totalDuration = chunks.reduce((sum, chunk) => sum + chunk.duration, 0);
  const totalSamples = Math.floor(totalDuration * sampleRate);

  const mergedBuffer = audioContext.createBuffer(1, totalSamples, sampleRate);

  const channelData = mergedBuffer.getChannelData(0);
  let currentSample = 0;

  for (const chunk of chunks) {
    const chunkArrayBuffer = await chunk.blob.arrayBuffer();
    const chunkAudioBuffer =
      await audioContext.decodeAudioData(chunkArrayBuffer);
    const chunkData = chunkAudioBuffer.getChannelData(0);

    const chunkSamples = Math.min(
      chunkData.length,
      totalSamples - currentSample,
    );

    for (let i = 0; i < chunkSamples; i++) {
      if (currentSample + i < totalSamples) {
        channelData[currentSample + i] = chunkData[i];
      }
    }

    currentSample += chunkSamples;
  }

  await audioContext.close();

  const interleaved = interleave(mergedBuffer);
  return encodeWav(interleaved, sampleRate);
}
