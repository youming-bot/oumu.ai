import { generateWaveform } from '@/lib/waveform-generator';

// Mock AudioContext
global.AudioContext = jest.fn().mockImplementation(() => ({
  decodeAudioData: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
}));

describe('WaveformGenerator', () => {
  let mockAudioContext: any;
  let mockAudioBuffer: any;

  beforeEach(() => {
    // Create mock audio buffer
    mockAudioBuffer = {
      duration: 10, // 10 seconds
      sampleRate: 44100,
      length: 441000, // 10 seconds * 44100 samples/sec
      getChannelData: jest.fn().mockReturnValue(new Float32Array(441000).fill(0.5)),
    };

    // Create mock audio context
    mockAudioContext = {
      decodeAudioData: jest.fn().mockResolvedValue(mockAudioBuffer),
      close: jest.fn().mockResolvedValue(undefined),
    };

    global.AudioContext.mockImplementation(() => mockAudioContext);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateWaveform', () => {
    it('should generate waveform data with default config', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });

      const result = await generateWaveform(mockBlob);

      expect(result).toEqual({
        peaks: expect.any(Array),
        duration: 10,
        sampleRate: 44100,
        resolution: 100,
      });

      expect(result.peaks).toHaveLength(1000); // 10 seconds * 100 points/second
      expect(mockAudioContext.decodeAudioData).toHaveBeenCalledWith(expect.any(ArrayBuffer));
      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it('should generate waveform with custom resolution', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });
      const config = { resolution: 50 };

      const result = await generateWaveform(mockBlob, config);

      expect(result.resolution).toBe(50);
      expect(result.peaks).toHaveLength(500); // 10 seconds * 50 points/second
    });

    it('should handle audio decoding errors', async () => {
      const mockBlob = new Blob(['invalid audio'], { type: 'audio/wav' });
      mockAudioContext.decodeAudioData.mockRejectedValue(new Error('Invalid audio format'));

      await expect(generateWaveform(mockBlob)).rejects.toThrow('Invalid audio format');

      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it('should generate peaks correctly from audio samples', async () => {
      // Create mock channel data with varying amplitudes
      const channelData = new Float32Array(441000);
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = Math.sin(i * 0.001) * 0.8; // Sine wave with 0.8 amplitude
      }

      mockAudioBuffer.getChannelData.mockReturnValue(channelData);

      const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });
      const result = await generateWaveform(mockBlob);

      expect(result.peaks.every((peak) => peak >= 0 && peak <= 1)).toBe(true);
      expect(result.peaks.some((peak) => peak > 0)).toBe(true);
    });

    it('should apply smoothing when enabled', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });
      const config = { smoothing: true, smoothingWindow: 3 };

      const result = await generateWaveform(mockBlob, config);

      expect(result.peaks).toHaveLength(1000);
      // Smoothed peaks should have less variation
      expect(result.peaks.every((peak) => peak >= 0 && peak <= 1)).toBe(true);
    });

    it('should disable smoothing when requested', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });
      const config = { smoothing: false };

      const result = await generateWaveform(mockBlob, config);

      expect(result.peaks).toHaveLength(1000);
    });

    it('should handle very short audio files', async () => {
      mockAudioBuffer.duration = 0.1; // 100ms
      mockAudioBuffer.length = 4410; // 0.1 seconds * 44100 samples/sec
      mockAudioBuffer.getChannelData.mockReturnValue(new Float32Array(4410).fill(0.3));

      const mockBlob = new Blob(['short audio'], { type: 'audio/wav' });
      const result = await generateWaveform(mockBlob);

      expect(result.duration).toBe(0.1);
      expect(result.peaks).toHaveLength(10); // 0.1 seconds * 100 points/second
    });

    it('should handle mono audio (single channel)', async () => {
      const mockBlob = new Blob(['mono audio'], { type: 'audio/wav' });

      const result = await generateWaveform(mockBlob);

      expect(mockAudioBuffer.getChannelData).toHaveBeenCalledWith(0);
      expect(result.peaks).toHaveLength(1000);
    });

    it('should handle empty audio data', async () => {
      mockAudioBuffer.duration = 0;
      mockAudioBuffer.length = 0;
      mockAudioBuffer.getChannelData.mockReturnValue(new Float32Array(0));

      const mockBlob = new Blob([''], { type: 'audio/wav' });
      const result = await generateWaveform(mockBlob);

      expect(result.duration).toBe(0);
      expect(result.peaks).toHaveLength(0);
    });

    it('should close audio context even when error occurs', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });
      const error = new Error('Processing error');

      // Make getChannelData throw an error
      mockAudioBuffer.getChannelData.mockImplementation(() => {
        throw error;
      });

      await expect(generateWaveform(mockBlob)).rejects.toThrow('Processing error');

      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it('should handle custom smoothing window size', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });
      const config = {
        smoothing: true,
        smoothingWindow: 5,
      };

      const result = await generateWaveform(mockBlob, config);

      expect(result.peaks).toHaveLength(1000);
      expect(result.peaks.every((peak) => peak >= 0 && peak <= 1)).toBe(true);
    });
  });
});
