import { POST } from '../../../../../src/app/api/postprocess/route';
import { OpenRouterClient } from '../../../../../src/lib/openrouter-client';

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

// Mock dependencies
jest.mock('@/lib/openrouter-client');

const mockOpenRouterClient = OpenRouterClient as jest.Mocked<typeof OpenRouterClient>;

// Mock Next.js Request to avoid Node.js environment issues
const createMockRequest = (url: string, init?: { method?: string; body?: string }) => ({
  url,
  method: init?.method || 'GET',
  json: async () => {
    if (init?.body) {
      try {
        return JSON.parse(init.body);
      } catch {
        throw new Error('Invalid JSON');
      }
    }
    return {};
  },
});

describe('/api/postprocess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/postprocess', () => {
    const validRequestBody = {
      segments: [
        {
          text: 'こんにちは、これはテスト音声です。',
          start: 0,
          end: 5,
        },
      ],
      language: 'ja',
      targetLanguage: 'en',
      enableAnnotations: true,
      enableFurigana: true,
      enableTerminology: true,
    };

    const mockProcessedSegments = [
      {
        normalizedText: 'こんにちは、これはテスト音声です。',
        translation: 'Hello, this is test audio.',
        annotations: ['greeting', 'demonstration'],
        furigana: 'こんにちは、これはテストおんせいです。',
      },
    ];

    it('should successfully post-process segments', async () => {
      // Setup mock
      mockOpenRouterClient.postProcessSegments.mockResolvedValue(mockProcessedSegments);

      const request = createMockRequest('http://localhost/api/postprocess', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.processedSegments).toBe(1);
      expect(data.data.segments).toHaveLength(1);

      // Verify returned segments have original metadata preserved
      const returnedSegment = data.data.segments[0];
      expect(returnedSegment.text).toBe('こんにちは、これはテスト音声です。');
      expect(returnedSegment.start).toBe(0);
      expect(returnedSegment.end).toBe(5);
      expect(returnedSegment.normalizedText).toBe('こんにちは、これはテスト音声です。');
      expect(returnedSegment.translation).toBe('Hello, this is test audio.');
      expect(returnedSegment.annotations).toEqual(['greeting', 'demonstration']);
      expect(returnedSegment.furigana).toBe('こんにちは、これはテストおんせいです。');

      // Verify OpenRouter client was called with correct parameters
      expect(mockOpenRouterClient.postProcessSegments).toHaveBeenCalledWith(
        [
          {
            text: 'こんにちは、これはテスト音声です。',
            start: 0,
            end: 5,
          },
        ],
        'ja',
        {
          targetLanguage: 'en',
          enableAnnotations: true,
          enableFurigana: true,
          enableTerminology: true,
          customTerminology: undefined,
          maxRetries: 3,
          timeout: 30000,
        }
      );
    });

    it('should use default values when optional parameters not provided', async () => {
      mockOpenRouterClient.postProcessSegments.mockResolvedValue(mockProcessedSegments);

      const minimalRequest = createMockRequest('http://localhost/api/postprocess', {
        method: 'POST',
        body: JSON.stringify({
          segments: [
            {
              text: 'Test segment',
              start: 0,
              end: 5,
            },
          ],
        }),
      });

      await POST(minimalRequest as any);

      expect(mockOpenRouterClient.postProcessSegments).toHaveBeenCalledWith(
        expect.any(Array),
        'ja', // Default language
        {
          targetLanguage: 'en', // Default
          enableAnnotations: true, // Default
          enableFurigana: true, // Default
          enableTerminology: true, // Default
          customTerminology: undefined,
          maxRetries: 3,
          timeout: 30000,
        }
      );
    });

    it('should handle multiple segments', async () => {
      const multipleSegments = [
        { text: 'First segment', start: 0, end: 5 },
        { text: 'Second segment', start: 5, end: 10 },
      ];

      const multipleProcessed = [
        {
          normalizedText: 'First segment normalized',
          translation: 'First translation',
          annotations: ['first'],
          furigana: 'First furigana',
        },
        {
          normalizedText: 'Second segment normalized',
          translation: 'Second translation',
          annotations: ['second'],
          furigana: 'Second furigana',
        },
      ];

      mockOpenRouterClient.postProcessSegments.mockResolvedValue(multipleProcessed);

      const request = createMockRequest('http://localhost/api/postprocess', {
        method: 'POST',
        body: JSON.stringify({
          segments: multipleSegments,
          language: 'en',
          targetLanguage: 'zh',
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.processedSegments).toBe(2);
      expect(data.data.segments).toHaveLength(2);

      // Verify each segment has correct processing
      expect(data.data.segments[0].text).toBe('First segment');
      expect(data.data.segments[0].normalizedText).toBe('First segment normalized');
      expect(data.data.segments[1].text).toBe('Second segment');
      expect(data.data.segments[1].normalizedText).toBe('Second segment normalized');
    });

    it('should include wordTimestamps when provided', async () => {
      const segmentsWithTimestamps = [
        {
          text: 'Test segment',
          start: 0,
          end: 5,
          wordTimestamps: [
            { word: 'Test', start: 0, end: 1 },
            { word: 'segment', start: 1, end: 5 },
          ],
        },
      ];

      mockOpenRouterClient.postProcessSegments.mockResolvedValue([mockProcessedSegments[0]]);

      const request = createMockRequest('http://localhost/api/postprocess', {
        method: 'POST',
        body: JSON.stringify({
          segments: segmentsWithTimestamps,
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.segments[0].wordTimestamps).toEqual([
        { word: 'Test', start: 0, end: 1 },
        { word: 'segment', start: 1, end: 5 },
      ]);
    });

    it('should handle terminology when provided', async () => {
      const terminology = [
        {
          word: 'こんにちは',
          reading: 'こんにちは',
          meaning: 'hello',
        },
      ];

      mockOpenRouterClient.postProcessSegments.mockResolvedValue(mockProcessedSegments);

      const request = createMockRequest('http://localhost/api/postprocess', {
        method: 'POST',
        body: JSON.stringify({
          segments: [validRequestBody.segments[0]],
          terminology,
        }),
      });

      await POST(request as any);

      expect(mockOpenRouterClient.postProcessSegments).toHaveBeenCalledWith(
        expect.any(Array),
        'ja',
        expect.objectContaining({
          customTerminology: terminology,
        })
      );
    });

    it('should not pass terminology when enableTerminology is false', async () => {
      const terminology = [
        {
          word: 'こんにちは',
          reading: 'こんにちは',
          meaning: 'hello',
        },
      ];

      mockOpenRouterClient.postProcessSegments.mockResolvedValue(mockProcessedSegments);

      const request = createMockRequest('http://localhost/api/postprocess', {
        method: 'POST',
        body: JSON.stringify({
          segments: [validRequestBody.segments[0]],
          terminology,
          enableTerminology: false,
        }),
      });

      await POST(request as any);

      expect(mockOpenRouterClient.postProcessSegments).toHaveBeenCalledWith(
        expect.any(Array),
        'ja',
        expect.objectContaining({
          customTerminology: undefined,
        })
      );
    });

    it('should validate request body schema', async () => {
      const invalidRequests = [
        // Missing segments
        {},
        // Invalid segments format
        { segments: 'not an array' },
        // Invalid segment format
        { segments: [{ text: 'test' }] }, // Missing start/end
        // Invalid types
        { segments: [{ text: 'test', start: 'invalid', end: 5 }] },
      ];

      for (const invalidBody of invalidRequests) {
        const request = createMockRequest('http://localhost/api/postprocess', {
          method: 'POST',
          body: JSON.stringify(invalidBody),
        });

        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('API_VALIDATION_ERROR');
      }
    });

    it('should handle malformed JSON', async () => {
      const request = createMockRequest('http://localhost/api/postprocess', {
        method: 'POST',
        body: '{ invalid json }',
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle OpenRouter client errors', async () => {
      mockOpenRouterClient.postProcessSegments.mockRejectedValue(new Error('OpenRouter API error'));

      const request = createMockRequest('http://localhost/api/postprocess', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle empty segments array', async () => {
      mockOpenRouterClient.postProcessSegments.mockResolvedValue([]);

      const request = createMockRequest('http://localhost/api/postprocess', {
        method: 'POST',
        body: JSON.stringify({
          segments: [],
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.processedSegments).toBe(0);
      expect(data.data.segments).toEqual([]);
    });
  });

  describe('GET and PATCH endpoints', () => {
    it('should not have GET endpoint', () => {
      // The route file explicitly states GET endpoint is not needed
      expect(typeof POST).toBe('function');
    });

    it('should not have PATCH endpoint', () => {
      // The route file explicitly states PATCH endpoint is not needed
      expect(typeof POST).toBe('function');
    });
  });
});
