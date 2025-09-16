export interface WaveformData {
  peaks: number[];
  duration: number;
  sampleRate: number;
  resolution: number;
}

export interface WaveformConfig {
  resolution?: number; // Number of points per second
  smoothing?: boolean;
  smoothingWindow?: number;
}

export class WaveformGenerator {
  static async generateWaveform(
    blob: Blob,
    config: WaveformConfig = {}
  ): Promise<WaveformData> {
    const {
      resolution = 100, // 100 points per second
      smoothing = true,
      smoothingWindow = 3
    } = config;

    try {
      const audioContext = new AudioContext();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      await audioContext.close();

      const duration = audioBuffer.duration;
      const sampleRate = audioBuffer.sampleRate;
      const totalSamples = audioBuffer.length;
      const channelData = audioBuffer.getChannelData(0); // Use first channel

      // Calculate number of points needed
      const totalPoints = Math.floor(duration * resolution);
      const samplesPerPoint = Math.floor(totalSamples / totalPoints);

      const peaks: number[] = [];

      // Generate peaks
      for (let i = 0; i < totalPoints; i++) {
        const startSample = i * samplesPerPoint;
        const endSample = Math.min(startSample + samplesPerPoint, totalSamples);
        
        let max = 0;
        let min = 0;
        
        for (let j = startSample; j < endSample; j++) {
          const sample = channelData[j];
          max = Math.max(max, sample);
          min = Math.min(min, sample);
        }
        
        // Store the peak-to-peak value
        peaks.push(Math.max(Math.abs(max), Math.abs(min)));
      }

      // Apply smoothing if enabled
      const smoothedPeaks = smoothing 
        ? this.smoothPeaks(peaks, smoothingWindow)
        : peaks;

      return {
        peaks: smoothedPeaks,
        duration,
        sampleRate,
        resolution
      };

    } catch (error) {
      console.error('Waveform generation failed:', error);
      throw new Error(`Failed to generate waveform: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static smoothPeaks(peaks: number[], windowSize: number): number[] {
    const smoothed: number[] = [];
    const halfWindow = Math.floor(windowSize / 2);

    for (let i = 0; i < peaks.length; i++) {
      let sum = 0;
      let count = 0;

      for (let j = -halfWindow; j <= halfWindow; j++) {
        const index = i + j;
        if (index >= 0 && index < peaks.length) {
          sum += peaks[index];
          count++;
        }
      }

      smoothed.push(sum / count);
    }

    return smoothed;
  }

  static async generateWaveformForFile(
    fileId: number,
    config?: WaveformConfig
  ): Promise<WaveformData> {
    try {
      const { FileUploadUtils } = await import('./file-upload');
      const blob = await FileUploadUtils.getFileBlob(fileId);
      
      return await this.generateWaveform(blob, config);
    } catch (error) {
      console.error('Failed to generate waveform for file:', error);
      throw error;
    }
  }

  static normalizePeaks(peaks: number[], maxHeight: number = 1): number[] {
    if (peaks.length === 0) return [];
    
    const maxPeak = Math.max(...peaks);
    if (maxPeak === 0) return peaks;
    
    return peaks.map(peak => (peak / maxPeak) * maxHeight);
  }

  static compressPeaks(peaks: number[], targetLength: number): number[] {
    if (peaks.length <= targetLength) return peaks;
    
    const compressionRatio = peaks.length / targetLength;
    const compressed: number[] = [];
    
    for (let i = 0; i < targetLength; i++) {
      const startIndex = Math.floor(i * compressionRatio);
      const endIndex = Math.floor((i + 1) * compressionRatio);
      
      let maxPeak = 0;
      for (let j = startIndex; j < endIndex && j < peaks.length; j++) {
        maxPeak = Math.max(maxPeak, peaks[j]);
      }
      
      compressed.push(maxPeak);
    }
    
    return compressed;
  }
}