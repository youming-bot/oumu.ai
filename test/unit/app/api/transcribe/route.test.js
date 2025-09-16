import { NextRequest } from 'next/server';
import { POST, GET, DELETE } from '../../../../../src/app/api/transcribe/route';
import { DBUtils } from '../../../../../src/lib/db';
import { GroqTranscriptionClient } from '../../../../../src/lib/groq-client';
import { AudioProcessor } from '../../../../../src/lib/audio-processor';
import { WordTimestampService } from '../../../../../src/lib/word-timestamp-service';

// Mock all dependencies
jest.mock('@/lib/db');
jest.mock('@/lib/groq-client');
jest.mock('@/lib/audio-processor');
jest.mock('@/lib/word-timestamp-service');

const mockDBUtils = DBUtils as jest.Mocked<typeof DBUtils>;
const mockGroqClient = GroqTranscriptionClient as jest.Mocked<typeof GroqTranscriptionClient>;
const mockAudioProcessor = AudioProcessor as jest.Mocked<typeof AudioProcessor>;
const mockWordTimestampService = WordTimestampService as jest.Mocked<typeof WordTimestampService>;

describe('/api/transcribe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/transcribe', () => {
    const validRequestBody = {
      fileId: 1,
      language: 'ja',
      chunkSeconds: 45,
      overlap: 0.2,
    };

    const mockFile = {
      id: 1,
      name: 'test.mp3',
      size: 1024 * 1024,
      type: 'audio/mp3',
      blob: new Blob(['audio data']),
      duration: 180,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockTranscriptionResult = {
      text: 'こんにちは、これはテスト音声です。',
      duration: 180,
      segments: [
        {
          start: 0,
          end: 5,
          text: 'こんにちは、これはテスト音声です。',
        },
      ],
    };

    it('should successfully transcribe audio file', async () => {
      // Setup mocks
      mockDBUtils.getFile.mockResolvedValue(mockFile);
      mockDBUtils.getTranscriptsByFileId.mockResolvedValue([]);
      mockDBUtils.addTranscript.mockResolvedValue(1);
      mockDBUtils.addSegments.mockResolvedValue(undefined);
      mockDBUtils.updateTranscript.mockResolvedValue(undefined);

      mockAudioProcessor.processAudioFile.mockResolvedValue([
        { chunkIndex: 0, audioBlob: new Blob(['chunk1']) },
      ]);

      mockGroqClient.transcribeChunks.mockResolvedValue([
        { chunkIndex: 0, result: mockTranscriptionResult },
      ]);

      mockGroqClient.mergeTranscriptionResults.mockReturnValue(mockTranscriptionResult);

      mockWordTimestampService.generateWordTimestamps.mockReturnValue([
        { word: 'こんにちは', start: 0, end: 2.5 },
        { word: 'これは', start: 2.5, end: 3.5 },
        { word: 'テスト音声です', start: 3.5, end: 5 },
      ]);

      const request = new NextRequest('http://localhost/api/transcribe', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.transcriptId).toBe(1);
      expect(data.data.text).toBe(mockTranscriptionResult.text);
      expect(data.data.segmentCount).toBe(1);

      // Verify database operations
      expect(mockDBUtils.getFile).toHaveBeenCalledWith(1);
      expect(mockDBUtils.addTranscript).toHaveBeenCalledWith({
        fileId: 1,
        status: 'processing',
        language: 'ja',
        rawText: '',
        processingTime: 0,
      });
      expect(mockDBUtils.addSegments).toHaveBeenCalled();
      expect(mockDBUtils.updateTranscript).toHaveBeenCalledWith(1, {
        status: 'completed',
        rawText: mockTranscriptionResult.text,
        processingTime: 0,
      });
    });

    it('should validate request data', async () => {
      const invalidRequest = new NextRequest('http://localhost/api/transcribe', {
        method: 'POST',
        body: JSON.stringify({
          fileId: 'invalid', // Should be number
          language: 'ja',
        }),
      });

      const response = await POST(invalidRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 if file not found', async () => {
      mockDBUtils.getFile.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost/api/transcribe', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should return 409 if file already has completed transcription', async () => {
      mockDBUtils.getFile.mockResolvedValue(mockFile);
      mockDBUtils.getTranscriptsByFileId.mockResolvedValue([
        {
          id: 1,
          fileId: 1,
          status: 'completed',
          rawText: 'existing transcript',
          language: 'ja',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const request = new NextRequest('http://localhost/api/transcribe', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('FILE_ALREADY_PROCESSED');
    });

    it('should handle transcription errors', async () => {
      mockDBUtils.getFile.mockResolvedValue(mockFile);
      mockDBUtils.getTranscriptsByFileId.mockResolvedValue([]);
      mockDBUtils.addTranscript.mockResolvedValue(1);
      mockDBUtils.updateTranscript.mockResolvedValue(undefined);

      mockAudioProcessor.processAudioFile.mockRejectedValue(
        new Error('Audio processing failed')
      );

      const request = new NextRequest('http://localhost/api/transcribe', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);

      // Verify transcript status was updated to failed
      expect(mockDBUtils.updateTranscript).toHaveBeenCalledWith(1, {
        status: 'failed',
        error: expect.any(String),
      });
    });

    it('should use default parameters when not provided', async () => {
      mockDBUtils.getFile.mockResolvedValue(mockFile);
      mockDBUtils.getTranscriptsByFileId.mockResolvedValue([]);
      mockDBUtils.addTranscript.mockResolvedValue(1);

      const minimalRequest = new NextRequest('http://localhost/api/transcribe', {
        method: 'POST',
        body: JSON.stringify({ fileId: 1 }),
      });

      mockAudioProcessor.processAudioFile.mockResolvedValue([]);
      mockGroqClient.transcribeChunks.mockResolvedValue([]);
      mockGroqClient.mergeTranscriptionResults.mockReturnValue({
        text: '',
        duration: 0,
        segments: [],
      });

      await POST(minimalRequest);

      expect(mockDBUtils.addTranscript).toHaveBeenCalledWith({
        fileId: 1,
        status: 'processing',
        language: 'ja', // Default
        rawText: '',
        processingTime: 0,
      });

      expect(mockAudioProcessor.processAudioFile).toHaveBeenCalledWith(
        1,
        45, // Default chunkSeconds
        0.2 // Default overlap
      );
    });

    it('should handle progress callback during transcription', async () => {
      mockDBUtils.getFile.mockResolvedValue(mockFile);
      mockDBUtils.getTranscriptsByFileId.mockResolvedValue([]);
      mockDBUtils.addTranscript.mockResolvedValue(1);
      mockDBUtils.updateTranscript.mockResolvedValue(undefined);

      mockAudioProcessor.processAudioFile.mockResolvedValue([
        { chunkIndex: 0, audioBlob: new Blob(['chunk1']) },
      ]);

      // Mock transcription with progress callback
      mockGroqClient.transcribeChunks.mockImplementation(async (chunks, options) => {
        if (options.onProgress) {
          await options.onProgress({ progress: 50, chunkIndex: 0 });
        }
        return [{ chunkIndex: 0, result: mockTranscriptionResult }];
      });

      mockGroqClient.mergeTranscriptionResults.mockReturnValue(mockTranscriptionResult);

      const request = new NextRequest('http://localhost/api/transcribe', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      await POST(request);

      // Verify progress update was called
      expect(mockDBUtils.updateTranscript).toHaveBeenCalledWith(1, {
        status: 'processing',
      });
    });
  });

  describe('GET /api/transcribe', () => {
    it('should return transcripts with segments for valid fileId', async () => {
      const mockTranscripts = [
        {
          id: 1,
          fileId: 1,
          status: 'completed',
          rawText: 'test transcript',
          language: 'ja',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockSegments = [
        {
          id: 1,
          transcriptId: 1,
          start: 0,
          end: 5,
          text: 'test segment',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockDBUtils.getTranscriptsByFileId.mockResolvedValue(mockTranscripts);
      mockDBUtils.getSegmentsByTranscriptId.mockResolvedValue(mockSegments);

      const request = new NextRequest('http://localhost/api/transcribe?fileId=1');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.transcripts).toHaveLength(1);
      expect(data.data.transcripts[0].segments).toEqual(mockSegments);
    });

    it('should return 400 if fileId parameter is missing', async () => {
      const request = new NextRequest('http://localhost/api/transcribe');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('fileId parameter is required');
    });

    it('should return 400 if fileId is not a number', async () => {
      const request = new NextRequest('http://localhost/api/transcribe?fileId=invalid');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('fileId must be a number');
    });

    it('should handle transcripts without ids', async () => {
      const mockTranscripts = [
        {
          fileId: 1,
          status: 'completed',
          rawText: 'test transcript',
          language: 'ja',
          createdAt: new Date(),
          updatedAt: new Date(),
          // Missing id property
        },
      ];

      mockDBUtils.getTranscriptsByFileId.mockResolvedValue(mockTranscripts);

      const request = new NextRequest('http://localhost/api/transcribe?fileId=1');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DB_INTEGRITY_ERROR');
    });
  });

  describe('DELETE /api/transcribe', () => {
    it('should delete transcript successfully', async () => {
      const mockTranscript = {
        id: 1,
        fileId: 1,
        status: 'completed',
        rawText: 'test transcript',
        language: 'ja',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDBUtils.getTranscript.mockResolvedValue(mockTranscript);
      mockDBUtils.deleteTranscript.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost/api/transcribe?transcriptId=1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.message).toBe('Transcript deleted successfully');
      expect(mockDBUtils.deleteTranscript).toHaveBeenCalledWith(1);
    });

    it('should return 400 if transcriptId parameter is missing', async () => {
      const request = new NextRequest('http://localhost/api/transcribe', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('transcriptId parameter is required');
    });

    it('should return 400 if transcriptId is not a number', async () => {
      const request = new NextRequest('http://localhost/api/transcribe?transcriptId=invalid', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('transcriptId must be a number');
    });

    it('should return 404 if transcript not found', async () => {
      mockDBUtils.getTranscript.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost/api/transcribe?transcriptId=999', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should handle database transaction errors', async () => {
      const mockTranscript = {
        id: 1,
        fileId: 1,
        status: 'completed',
        rawText: 'test transcript',
        language: 'ja',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDBUtils.getTranscript.mockResolvedValue(mockTranscript);
      mockDBUtils.deleteTranscript.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost/api/transcribe?transcriptId=1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in POST request', async () => {
      const request = new NextRequest('http://localhost/api/transcribe', {
        method: 'POST',
        body: '{ invalid json }',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle database connection errors', async () => {
      mockDBUtils.getFile.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost/api/transcribe', {
        method: 'POST',
        body: JSON.stringify({ fileId: 1 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});