import { FileUploadUtils } from './file-upload';

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

export class AudioProcessor {
  static async getAudioDuration(blob: Blob): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const url = URL.createObjectURL(blob);
      
      audio.addEventListener('loadedmetadata', () => {
        const duration = audio.duration;
        URL.revokeObjectURL(url);
        resolve(duration);
      });
      
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load audio metadata'));
      });
      
      audio.src = url;
    });
  }

  static async sliceAudio(
    blob: Blob, 
    startTime: number, 
    endTime: number,
    chunkSeconds: number = 45,
    overlap: number = 0.2
  ): Promise<AudioChunk[]> {
    try {
      const audioContext = new AudioContext();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const chunks: AudioChunk[] = [];
      
      let currentStart = startTime;
      let chunkIndex = 0;
      
      while (currentStart < endTime) {
        const chunkEnd = Math.min(currentStart + chunkSeconds, endTime);
        const chunkDuration = chunkEnd - currentStart;
        
        if (chunkDuration <= 0) break;
        
        const chunkBlob = await this.extractAudioSegment(
          audioBuffer, 
          currentStart, 
          chunkEnd,
          audioContext
        );
        
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
      
      await audioContext.close();
      return chunks;
      
    } catch (error) {
      console.error('Audio slicing failed:', error);
      throw new Error(`Audio processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async extractAudioSegment(
    audioBuffer: AudioBuffer, 
    startTime: number, 
    endTime: number,
    audioContext: AudioContext
  ): Promise<Blob> {
    const sampleRate = audioBuffer.sampleRate;
    const startSample = Math.floor(startTime * sampleRate);
    const endSample = Math.floor(endTime * sampleRate);
    const frameCount = endSample - startSample;
    
    const numberOfChannels = audioBuffer.numberOfChannels;
    const offlineContext = new OfflineAudioContext(
      numberOfChannels, 
      frameCount, 
      sampleRate
    );
    
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    
    const destination = offlineContext.createGain();
    source.connect(destination);
    destination.connect(offlineContext.destination);
    
    source.start(0, startTime, endTime - startTime);

    await offlineContext.startRendering();
    
    return new Promise((resolve) => {
      offlineContext.oncomplete = (event) => {
        const buffer = event.renderedBuffer;
        
        const interleaved = this.interleave(buffer);
        const wavBlob = this.encodeWAV(interleaved, buffer.sampleRate);
        
        resolve(wavBlob);
      };
    });
  }

  private static interleave(buffer: AudioBuffer): Float32Array {
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

  private static encodeWAV(samples: Float32Array, sampleRate: number): Blob {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
      for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);
    floatTo16BitPCM(view, 44, samples);
    
    return new Blob([view], { type: 'audio/wav' });
  }

  static async processAudioFile(
    fileId: number, 
    chunkSeconds: number = 45, 
    overlap: number = 0.2
  ): Promise<AudioChunk[]> {
    try {
      const blob = await FileUploadUtils.getFileBlob(fileId);
      const duration = await this.getAudioDuration(blob);
      
      await FileUploadUtils.updateFileMetadata(fileId, { duration });
      
      const chunks = await this.sliceAudio(
        blob, 
        0, 
        duration, 
        chunkSeconds, 
        overlap
      );
      
      console.log(`Audio processed into ${chunks.length} chunks`);
      return chunks;
      
    } catch (error) {
      console.error('Audio processing failed:', error);
      throw error;
    }
  }

  static async getAudioMetadata(blob: Blob): Promise<AudioMetadata> {
    try {
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
      
    } catch (error) {
      console.error('Failed to get audio metadata:', error);
      throw error;
    }
  }

  static async mergeAudioChunks(chunks: AudioChunk[]): Promise<Blob> {
    if (chunks.length === 0) {
      throw new Error('No chunks to merge');
    }
    
    try {
      const audioContext = new AudioContext();
      const sampleRate = 44100; // Standard sample rate
      
      const totalDuration = chunks.reduce((sum, chunk) => sum + chunk.duration, 0);
      const totalSamples = Math.floor(totalDuration * sampleRate);
      
      const mergedBuffer = audioContext.createBuffer(
        1, 
        totalSamples, 
        sampleRate
      );
      
      const channelData = mergedBuffer.getChannelData(0);
      let currentSample = 0;
      
      for (const chunk of chunks) {
        const chunkArrayBuffer = await chunk.blob.arrayBuffer();
        const chunkAudioBuffer = await audioContext.decodeAudioData(chunkArrayBuffer);
        const chunkData = chunkAudioBuffer.getChannelData(0);
        
        const chunkSamples = Math.min(chunkData.length, totalSamples - currentSample);
        
        for (let i = 0; i < chunkSamples; i++) {
          if (currentSample + i < totalSamples) {
            channelData[currentSample + i] = chunkData[i];
          }
        }
        
        currentSample += chunkSamples;
      }
      
      await audioContext.close();
      
      const interleaved = this.interleave(mergedBuffer);
      return this.encodeWAV(interleaved, sampleRate);
      
    } catch (error) {
      console.error('Audio chunk merging failed:', error);
      throw error;
    }
  }
}