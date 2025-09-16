import { TranscriptionService } from '@/lib/transcription-service';
import { DBUtils } from '@/lib/db';

// Mock fetch
global.fetch = jest.fn();

// Mock DBUtils
jest.mock('@/lib/db', () => ({
  DBUtils: {
    getFile: jest.fn(),
    getTranscriptsByFileId: jest.fn(),
    addTranscript: jest.fn(),
    updateTranscript: jest.fn(),
    getTranscript: jest.fn(),
    getTranscriptWithSegments: jest.fn()
  }
}));

describe('Transcription Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    TranscriptionService.clearProgress(123);
  });

  describe('transcribeAudio', () => {
    test('should start transcription for valid file', async () => {
      // Arrange
      const mockFile = { id: 123, name: 'test.mp3' };
      const mockTranscripts = [];
      const mockTranscriptId = 456;

      DBUtils.getFile.mockResolvedValue(mockFile);
      DBUtils.getTranscriptsByFileId.mockResolvedValue(mockTranscripts);
      DBUtils.addTranscript.mockResolvedValue(mockTranscriptId);

      // Mock successful API response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, text: 'transcribed text' })
      });

      const progressCallback = jest.fn();

      // Act
      const transcriptId = await TranscriptionService.transcribeAudio(123, {
        language: 'ja',
        onProgress: progressCallback
      });

      // Assert
      expect(transcriptId).toBe(456);
      expect(DBUtils.getFile).toHaveBeenCalledWith(123);
      expect(DBUtils.getTranscriptsByFileId).toHaveBeenCalledWith(123);
      expect(DBUtils.addTranscript).toHaveBeenCalledWith({
        fileId: 123,
        status: 'processing',
        language: 'ja'
      });

      // Check that fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: 123,
          language: 'ja',
          chunkSeconds: 45,
          overlap: 0.2
        })
      });

      // Check progress updates
      expect(progressCallback).toHaveBeenCalled();
    });

    test('should return existing completed transcript', async () => {
      // Arrange
      const mockFile = { id: 123, name: 'test.mp3' };
      const mockTranscripts = [
        { id: 456, status: 'completed', fileId: 123 }
      ];

      DBUtils.getFile.mockResolvedValue(mockFile);
      DBUtils.getTranscriptsByFileId.mockResolvedValue(mockTranscripts);

      // Act
      const transcriptId = await TranscriptionService.transcribeAudio(123);

      // Assert
      expect(transcriptId).toBe(456);
      expect(DBUtils.addTranscript).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should throw error for non-existent file', async () => {
      // Arrange
      DBUtils.getFile.mockResolvedValue(undefined);

      // Act & Assert
      await expect(TranscriptionService.transcribeAudio(999)).rejects.toThrow('File not found');
    });

    test('should handle API errors during transcription', async () => {
      // Arrange
      const mockFile = { id: 123, name: 'test.mp3' };
      const mockTranscripts = [];
      const mockTranscriptId = 456;

      DBUtils.getFile.mockResolvedValue(mockFile);
      DBUtils.getTranscriptsByFileId.mockResolvedValue(mockTranscripts);
      DBUtils.addTranscript.mockResolvedValue(mockTranscriptId);
      DBUtils.updateTranscript.mockResolvedValue();

      // Mock API error response
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'API error' })
      });

      // Act & Assert
      await expect(TranscriptionService.transcribeAudio(123)).rejects.toThrow('Transcription failed: API error');
      expect(DBUtils.updateTranscript).toHaveBeenCalledWith(456, {
        status: 'failed',
        error: 'API error'
      });
    });

    test('should handle network errors during transcription', async () => {
      // Arrange
      const mockFile = { id: 123, name: 'test.mp3' };
      const mockTranscripts = [];
      const mockTranscriptId = 456;

      DBUtils.getFile.mockResolvedValue(mockFile);
      DBUtils.getTranscriptsByFileId.mockResolvedValue(mockTranscripts);
      DBUtils.addTranscript.mockResolvedValue(mockTranscriptId);
      DBUtils.updateTranscript.mockResolvedValue();

      // Mock network error
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(TranscriptionService.transcribeAudio(123)).rejects.toThrow('Transcription failed: Network error');
      expect(DBUtils.updateTranscript).toHaveBeenCalledWith(456, {
        status: 'failed',
        error: 'Network error'
      });
    });
  });

  describe('postProcessTranscript', () => {
    test('should post-process completed transcript', async () => {
      // Arrange
      const mockTranscript = { id: 456, status: 'completed', fileId: 123 };

      DBUtils.getTranscript.mockResolvedValue(mockTranscript);

      // Mock successful API response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      });

      // Act
      await TranscriptionService.postProcessTranscript(456, {
        targetLanguage: 'en',
        enableAnnotations: true,
        enableFurigana: true,
        enableTerminology: true
      });

      // Assert
      expect(DBUtils.getTranscript).toHaveBeenCalledWith(456);
      expect(global.fetch).toHaveBeenCalledWith('/api/postprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptId: 456,
          targetLanguage: 'en',
          enableAnnotations: true,
          enableFurigana: true,
          enableTerminology: true
        })
      });
    });

    test('should throw error for non-existent transcript', async () => {
      // Arrange
      DBUtils.getTranscript.mockResolvedValue(undefined);

      // Act & Assert
      await expect(TranscriptionService.postProcessTranscript(999)).rejects.toThrow('Transcript not found');
    });

    test('should throw error for incomplete transcript', async () => {
      // Arrange
      const mockTranscript = { id: 456, status: 'processing', fileId: 123 };

      DBUtils.getTranscript.mockResolvedValue(mockTranscript);

      // Act & Assert
      await expect(TranscriptionService.postProcessTranscript(456)).rejects.toThrow('Transcript must be completed before post-processing');
    });

    test('should handle API errors during post-processing', async () => {
      // Arrange
      const mockTranscript = { id: 456, status: 'completed', fileId: 123 };

      DBUtils.getTranscript.mockResolvedValue(mockTranscript);

      // Mock API error response
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'Post-processing error' })
      });

      // Act & Assert
      await expect(TranscriptionService.postProcessTranscript(456)).rejects.toThrow('Post-processing failed: Post-processing error');
    });
  });

  describe('getTranscriptWithSegments', () => {
    test('should return transcript with segments', async () => {
      // Arrange
      const mockResult = {
        transcript: { id: 456, status: 'completed' },
        segments: [{ id: 1, text: 'Hello' }, { id: 2, text: 'World' }]
      };

      DBUtils.getTranscriptWithSegments.mockResolvedValue(mockResult);

      // Act
      const result = await TranscriptionService.getTranscriptWithSegments(456);

      // Assert
      expect(result).toEqual(mockResult);
      expect(DBUtils.getTranscriptWithSegments).toHaveBeenCalledWith(456);
    });

    test('should rethrow database errors', async () => {
      // Arrange
      DBUtils.getTranscriptWithSegments.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(TranscriptionService.getTranscriptWithSegments(456)).rejects.toThrow('Database error');
    });
  });

  describe('getFileTranscripts', () => {
    test('should return transcripts for file', async () => {
      // Arrange
      const mockTranscripts = [
        { id: 1, status: 'completed' },
        { id: 2, status: 'processing' }
      ];

      DBUtils.getTranscriptsByFileId.mockResolvedValue(mockTranscripts);

      // Act
      const transcripts = await TranscriptionService.getFileTranscripts(123);

      // Assert
      expect(transcripts).toEqual(mockTranscripts);
      expect(DBUtils.getTranscriptsByFileId).toHaveBeenCalledWith(123);
    });

    test('should rethrow database errors', async () => {
      // Arrange
      DBUtils.getTranscriptsByFileId.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(TranscriptionService.getFileTranscripts(123)).rejects.toThrow('Database error');
    });
  });

  describe('progress tracking', () => {
    test('should track and update transcription progress', () => {
      // Arrange
      const progressCallback = jest.fn();

      // Act
      TranscriptionService.updateProgress(123, {
        status: 'processing',
        progress: 50,
        currentChunk: 2,
        totalChunks: 4
      }, { onProgress: progressCallback });

      // Assert
      const progress = TranscriptionService.getTranscriptionProgress(123);
      expect(progress).toEqual({
        fileId: 123,
        status: 'processing',
        progress: 50,
        currentChunk: 2,
        totalChunks: 4
      });
      expect(progressCallback).toHaveBeenCalledWith(progress);
    });

    test('should clear progress', () => {
      // Arrange
      TranscriptionService.updateProgress(123, { status: 'processing', progress: 50 });

      // Act
      TranscriptionService.clearProgress(123);

      // Assert
      const progress = TranscriptionService.getTranscriptionProgress(123);
      expect(progress).toBeUndefined();
    });

    test('should return undefined for non-existent progress', () => {
      // Act
      const progress = TranscriptionService.getTranscriptionProgress(999);

      // Assert
      expect(progress).toBeUndefined();
    });
  });

  describe('transcribeAndProcess', () => {
    test('should complete transcription and post-processing', async () => {
      // Arrange
      const mockFile = { id: 123, name: 'test.mp3' };
      const mockTranscripts = [];
      const mockTranscriptId = 456;

      DBUtils.getFile.mockResolvedValue(mockFile);
      DBUtils.getTranscriptsByFileId.mockResolvedValue(mockTranscripts);
      DBUtils.addTranscript.mockResolvedValue(mockTranscriptId);

      // Mock API responses
      global.fetch
        .mockResolvedValueOnce({ // Transcription API
          ok: true,
          json: jest.fn().mockResolvedValue({ success: true, text: 'transcribed text' })
        })
        .mockResolvedValueOnce({ // Post-processing API
          ok: true,
          json: jest.fn().mockResolvedValue({ success: true })
        });

      // Act
      const transcriptId = await TranscriptionService.transcribeAndProcess(123);

      // Assert
      expect(transcriptId).toBe(456);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalledWith('/api/transcribe', expect.anything());
      expect(global.fetch).toHaveBeenCalledWith('/api/postprocess', expect.anything());
    });

    test('should handle errors during combined process', async () => {
      // Arrange
      const mockFile = { id: 123, name: 'test.mp3' };
      const mockTranscripts = [];

      DBUtils.getFile.mockResolvedValue(mockFile);
      DBUtils.getTranscriptsByFileId.mockResolvedValue(mockTranscripts);

      // Mock transcription error
      global.fetch.mockRejectedValue(new Error('Transcription error'));

      // Act & Assert
      await expect(TranscriptionService.transcribeAndProcess(123)).rejects.toThrow('Transcription error');
    });
  });
});