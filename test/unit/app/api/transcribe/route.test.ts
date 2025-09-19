import { NextRequest } from 'next/server';
import { POST } from '../../../../../src/app/api/transcribe/route';
import { GroqTranscriptionClient } from '../../../../../src/lib/groq-client';
import { WordTimestampService } from '../../../../../src/lib/word-timestamp-service';

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, options) => {
    const urlObj = new URL(url);
    return {
      url,
      method: options?.method || 'GET',
      headers: {
        get: jest.fn(),
      },
      nextUrl: {
        searchParams: urlObj.searchParams,
      },
      json: () => Promise.resolve(options?.body ? JSON.parse(options.body) : {}),
      text: () => Promise.resolve(options?.body || ''),
    };
  }),
  NextResponse: {
    json: jest.fn().mockImplementation((data, init) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(data),
      headers: new Map(),
    })),
  },
}));

// Mock all dependencies
jest.mock('@/lib/groq-client');
jest.mock('@/lib/word-timestamp-service');

const mockGroqClient = GroqTranscriptionClient as jest.Mocked<typeof GroqTranscriptionClient>;
const mockWordTimestampService = WordTimestampService as jest.Mocked<typeof WordTimestampService>;

describe('/api/transcribe', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    mockWordTimestampService.generateWordTimestamps = jest.fn().mockReturnValue([]);
    mockWordTimestampService.getCurrentWord = jest.fn();
  });

  describe('POST /api/transcribe', () => {
    const validRequestBody = {
      fileData: {
        arrayBuffer: { data: [1, 2, 3, 4, 5] },
        name: 'test.mp3',
        size: 1024 * 1024,
        type: 'audio/mp3',
        duration: 180,
      },
      language: 'ja',
      chunkSeconds: 45,
      overlap: 0.2,
      chunks: [
        {
          arrayBuffer: { data: [1, 2, 3] },
          startTime: 0,
          endTime: 45,
          duration: 45,
          index: 0,
        },
      ],
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
      expect(data.data.text).toBe(mockTranscriptionResult.text);
      expect(data.data.duration).toBe(180);
      expect(data.data.segmentCount).toBe(1);
      expect(data.data.processingTime).toBe(0);
      expect(data.data.segments).toHaveLength(1);
      expect(data.data.segments[0]).toEqual({
        start: 0,
        end: 5,
        text: 'こんにちは、これはテスト音声です。',
        wordTimestamps: [
          { word: 'こんにちは', start: 0, end: 2.5 },
          { word: 'これは', start: 2.5, end: 3.5 },
          { word: 'テスト音声です', start: 3.5, end: 5 },
        ],
      });

      // Verify transcription service calls
      expect(mockGroqClient.transcribeChunks).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            blob: expect.any(Blob),
            startTime: 0,
            endTime: 45,
            duration: 45,
            index: 0,
          }),
        ]),
        expect.objectContaining({
          language: 'ja',
          onProgress: expect.any(Function),
        })
      );
      expect(mockGroqClient.mergeTranscriptionResults).toHaveBeenCalledWith([
        { chunkIndex: 0, result: mockTranscriptionResult },
      ]);
    });

    it('should validate request data', async () => {
      const invalidRequest = new NextRequest('http://localhost/api/transcribe', {
        method: 'POST',
        body: JSON.stringify({
          fileData: 'invalid', // Should be object
          language: 'ja',
        }),
      });

      const response = await POST(invalidRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('API_VALIDATION_ERROR');
    });

    it('should handle missing required fields', async () => {
      const invalidRequest = new NextRequest('http://localhost/api/transcribe', {
        method: 'POST',
        body: JSON.stringify({
          language: 'ja',
          // Missing fileData and chunks
        }),
      });

      const response = await POST(invalidRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('API_VALIDATION_ERROR');
    });

    it('should use default parameters when not provided', async () => {
      const minimalRequest = {
        fileData: {
          arrayBuffer: { data: [1, 2, 3, 4, 5] },
          name: 'test.mp3',
          size: 1024 * 1024,
          type: 'audio/mp3',
          duration: 180,
        },
        chunks: [
          {
            arrayBuffer: { data: [1, 2, 3] },
            startTime: 0,
            endTime: 45,
            duration: 45,
            index: 0,
          },
        ],
      };

      mockGroqClient.transcribeChunks.mockResolvedValue([
        { chunkIndex: 0, result: mockTranscriptionResult },
      ]);

      mockGroqClient.mergeTranscriptionResults.mockReturnValue(mockTranscriptionResult);

      mockWordTimestampService.generateWordTimestamps.mockReturnValue([]);

      const request = new NextRequest('http://localhost/api/transcribe', {
        method: 'POST',
        body: JSON.stringify(minimalRequest),
      });

      await POST(request);

      expect(mockGroqClient.transcribeChunks).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          language: 'ja', // Default
        })
      );
    });

    it('should handle transcription service errors', async () => {
      mockGroqClient.transcribeChunks.mockRejectedValue(new Error('Transcription service failed'));

      const request = new NextRequest('http://localhost/api/transcribe', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('should handle malformed JSON in request body', async () => {
      const request = new NextRequest('http://localhost/api/transcribe', {
        method: 'POST',
        body: '{ invalid json }',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('should generate word timestamps for each segment', async () => {
      const multiSegmentResult = {
        text: 'こんにちは。これはテストです。',
        duration: 180,
        segments: [
          {
            start: 0,
            end: 3,
            text: 'こんにちは。',
          },
          {
            start: 3,
            end: 8,
            text: 'これはテストです。',
          },
        ],
      };

      mockGroqClient.transcribeChunks.mockResolvedValue([
        { chunkIndex: 0, result: multiSegmentResult },
      ]);

      mockGroqClient.mergeTranscriptionResults.mockReturnValue(multiSegmentResult);

      const mockWordTimestamps1 = [
        { word: 'こんにちは', start: 0, end: 2 },
        { word: '。', start: 2, end: 3 },
      ];

      const mockWordTimestamps2 = [
        { word: 'これ', start: 3, end: 4 },
        { word: 'は', start: 4, end: 4.5 },
        { word: 'テスト', start: 4.5, end: 6 },
        { word: 'です', start: 6, end: 7 },
        { word: '。', start: 7, end: 8 },
      ];

      mockWordTimestampService.generateWordTimestamps
        .mockReturnValueOnce(mockWordTimestamps1)
        .mockReturnValueOnce(mockWordTimestamps2);

      const request = new NextRequest('http://localhost/api/transcribe', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.segments).toHaveLength(2);
      expect(data.data.segments[0].wordTimestamps).toEqual(mockWordTimestamps1);
      expect(data.data.segments[1].wordTimestamps).toEqual(mockWordTimestamps2);

      // Verify word timestamp generation was called for each segment
      expect(mockWordTimestampService.generateWordTimestamps).toHaveBeenCalledTimes(2);
      expect(mockWordTimestampService.generateWordTimestamps).toHaveBeenNthCalledWith(
        1,
        'こんにちは。',
        0,
        3
      );
      expect(mockWordTimestampService.generateWordTimestamps).toHaveBeenNthCalledWith(
        2,
        'これはテストです。',
        3,
        8
      );
    });
  });
});
