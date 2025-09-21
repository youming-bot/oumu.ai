import type { NextRequest } from 'next/server';
import { POST } from '../../../../../src/app/api/transcribe/route';
import { huggingFaceTranscriptionService } from '../../../../../src/lib/huggingface-transcription';
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
jest.mock('@/lib/huggingface-transcription');
jest.mock('@/lib/word-timestamp-service');

const mockHuggingFaceService = huggingFaceTranscriptionService as jest.Mocked<
  typeof huggingFaceTranscriptionService
>;
const mockWordTimestampService = WordTimestampService as jest.Mocked<typeof WordTimestampService>;

describe('/api/transcribe', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    mockHuggingFaceService.transcribe = jest.fn().mockResolvedValue({
      text: 'Test transcription',
      language: 'ja',
      duration: 30.5,
      segments: [
        {
          start: 0,
          end: 2.5,
          text: 'Test segment',
        },
      ],
    });

    mockWordTimestampService.generateWordTimestamps = jest.fn().mockReturnValue([
      {
        word: 'Test',
        start: 0,
        end: 1.0,
      },
      {
        word: 'segment',
        start: 1.0,
        end: 2.5,
      },
    ]);
  });

  describe('POST', () => {
    it('should handle valid transcription request', async () => {
      const mockRequest = {
        json: () =>
          Promise.resolve({
            fileData: {
              name: 'test.mp3',
              size: 1024000,
              type: 'audio/mpeg',
              arrayBuffer: {
                type: 'Buffer',
                data: [1, 2, 3, 4, 5],
              },
            },
            language: 'ja',
            chunks: [
              {
                startTime: 0,
                endTime: 30,
                duration: 30,
                arrayBuffer: {
                  type: 'Buffer',
                  data: [1, 2, 3, 4, 5],
                },
              },
            ],
          }),
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.text).toBe('Test transcription');
      expect(mockHuggingFaceService.transcribe).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const mockRequest = {
        json: () =>
          Promise.resolve({
            // Missing required fields
          }),
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should handle transcription errors', async () => {
      mockHuggingFaceService.transcribe.mockRejectedValue(new Error('Transcription failed'));

      const mockRequest = {
        json: () =>
          Promise.resolve({
            fileData: {
              name: 'test.mp3',
              size: 1024000,
              type: 'audio/mpeg',
              arrayBuffer: {
                type: 'Buffer',
                data: [1, 2, 3, 4, 5],
              },
            },
            language: 'ja',
            chunks: [
              {
                startTime: 0,
                endTime: 30,
                duration: 30,
                arrayBuffer: {
                  type: 'Buffer',
                  data: [1, 2, 3, 4, 5],
                },
              },
            ],
          }),
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('Transcription failed');
    });

    it('should generate word timestamps for segments', async () => {
      const mockRequest = {
        json: () =>
          Promise.resolve({
            fileData: {
              name: 'test.mp3',
              size: 1024000,
              type: 'audio/mpeg',
              arrayBuffer: {
                type: 'Buffer',
                data: [1, 2, 3, 4, 5],
              },
            },
            language: 'ja',
            chunks: [
              {
                startTime: 0,
                endTime: 30,
                duration: 30,
                arrayBuffer: {
                  type: 'Buffer',
                  data: [1, 2, 3, 4, 5],
                },
              },
            ],
          }),
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.segments).toHaveLength(1);
      expect(data.data.segments[0].wordTimestamps).toHaveLength(2);
      expect(mockWordTimestampService.generateWordTimestamps).toHaveBeenCalled();
    });
  });
});
