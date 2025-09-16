import { NextRequest } from 'next/server';
import { POST, GET, PATCH } from '../../../../../src/app/api/postprocess/route';
import { DBUtils } from '../../../../../src/lib/db';
import { OpenRouterClient } from '../../../../../src/lib/openrouter-client';

// Mock dependencies
jest.mock('@/lib/db');
jest.mock('@/lib/openrouter-client');

const mockDBUtils = DBUtils as jest.Mocked<typeof DBUtils>;
const mockOpenRouterClient = OpenRouterClient as jest.Mocked<typeof OpenRouterClient>;

describe('/api/postprocess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/postprocess', () => {
    const validRequestBody = {
      transcriptId: 1,
      targetLanguage: 'en',
      enableAnnotations: true,
      enableFurigana: true,
      enableTerminology: true,
    };

    const mockTranscript = {
      id: 1,
      fileId: 1,
      status: 'completed',
      rawText: 'こんにちは、これはテスト音声です。',
      language: 'ja',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockSegments = [
      {
        id: 1,
        transcriptId: 1,
        start: 0,
        end: 5,
        text: 'こんにちは、これはテスト音声です。',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockProcessedSegments = [
      {
        originalText: 'こんにちは、これはテスト音声です。',
        normalizedText: 'こんにちは、これはテスト音声です。',
        translation: 'Hello, this is test audio.',
        annotations: ['greeting', 'demonstration'],
        furigana: 'こんにちは、これはテストおんせいです。',
        start: 0,
        end: 5,
      },
    ];

    const mockTerms = [
      {
        id: 1,
        word: 'こんにちは',
        reading: 'こんにちは',
        meaning: 'hello',
        category: 'greeting',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should successfully post-process transcript segments', async () => {
      // Setup mocks
      mockDBUtils.getTranscript.mockResolvedValue(mockTranscript);
      mockDBUtils.getSegmentsByTranscriptId.mockResolvedValue(mockSegments);
      mockDBUtils.getAllTerms.mockResolvedValue(mockTerms);
      mockDBUtils.updateSegment.mockResolvedValue(undefined);

      mockOpenRouterClient.postProcessSegments.mockResolvedValue(mockProcessedSegments);

      const request = new NextRequest('http://localhost/api/postprocess', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.transcriptId).toBe(1);
      expect(data.data.processedSegments).toBe(1);

      // Verify OpenRouter client was called with correct parameters
      expect(mockOpenRouterClient.postProcessSegments).toHaveBeenCalledWith(
        [
          {
            originalText: 'こんにちは、これはテスト音声です。',
            normalizedText: 'こんにちは、これはテスト音声です。',
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
          maxRetries: 3,
          timeout: 30000,
        },
        mockTerms
      );

      // Verify segment was updated
      expect(mockDBUtils.updateSegment).toHaveBeenCalledWith(1, {
        normalizedText: 'こんにちは、これはテスト音声です。',
        translation: 'Hello, this is test audio.',
        annotations: ['greeting', 'demonstration'],
        furigana: 'こんにちは、これはテストおんせいです。',
      });
    });

    it('should validate request data', async () => {
      const invalidRequest = new NextRequest('http://localhost/api/postprocess', {
        method: 'POST',
        body: JSON.stringify({
          transcriptId: 'invalid', // Should be number
          targetLanguage: 'en',
        }),
      });

      const response = await POST(invalidRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 if transcript not found', async () => {
      mockDBUtils.getTranscript.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost/api/postprocess', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 if transcript not completed', async () => {
      const processingTranscript = { ...mockTranscript, status: 'processing' };
      mockDBUtils.getTranscript.mockResolvedValue(processingTranscript);

      const request = new NextRequest('http://localhost/api/postprocess', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('Transcript must be completed before post-processing');
    });

    it('should return 404 if no segments found', async () => {
      mockDBUtils.getTranscript.mockResolvedValue(mockTranscript);
      mockDBUtils.getSegmentsByTranscriptId.mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/postprocess', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
      expect(data.error.message).toBe('No segments found for transcript');
    });

    it('should work without terminology when enableTerminology is false', async () => {
      mockDBUtils.getTranscript.mockResolvedValue(mockTranscript);
      mockDBUtils.getSegmentsByTranscriptId.mockResolvedValue(mockSegments);
      mockDBUtils.updateSegment.mockResolvedValue(undefined);

      mockOpenRouterClient.postProcessSegments.mockResolvedValue(mockProcessedSegments);

      const requestWithoutTerminology = {
        ...validRequestBody,
        enableTerminology: false,
      };

      const request = new NextRequest('http://localhost/api/postprocess', {
        method: 'POST',
        body: JSON.stringify(requestWithoutTerminology),
      });

      await POST(request);

      expect(mockDBUtils.getAllTerms).not.toHaveBeenCalled();
      expect(mockOpenRouterClient.postProcessSegments).toHaveBeenCalledWith(
        expect.any(Array),
        'ja',
        expect.objectContaining({ enableTerminology: false }),
        undefined // No terminology passed
      );
    });

    it('should continue without terminology if loading fails', async () => {
      mockDBUtils.getTranscript.mockResolvedValue(mockTranscript);
      mockDBUtils.getSegmentsByTranscriptId.mockResolvedValue(mockSegments);
      mockDBUtils.getAllTerms.mockRejectedValue(new Error('Terms loading failed'));
      mockDBUtils.updateSegment.mockResolvedValue(undefined);

      mockOpenRouterClient.postProcessSegments.mockResolvedValue(mockProcessedSegments);

      const request = new NextRequest('http://localhost/api/postprocess', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Should continue with undefined terminology
      expect(mockOpenRouterClient.postProcessSegments).toHaveBeenCalledWith(
        expect.any(Array),
        'ja',
        expect.any(Object),
        undefined
      );
    });

    it('should use default values when optional parameters not provided', async () => {
      mockDBUtils.getTranscript.mockResolvedValue(mockTranscript);
      mockDBUtils.getSegmentsByTranscriptId.mockResolvedValue(mockSegments);
      mockDBUtils.updateSegment.mockResolvedValue(undefined);

      mockOpenRouterClient.postProcessSegments.mockResolvedValue(mockProcessedSegments);

      const minimalRequest = new NextRequest('http://localhost/api/postprocess', {
        method: 'POST',
        body: JSON.stringify({ transcriptId: 1 }),
      });

      await POST(minimalRequest);

      expect(mockOpenRouterClient.postProcessSegments).toHaveBeenCalledWith(
        expect.any(Array),
        'ja',
        {
          targetLanguage: 'en', // Default
          enableAnnotations: true, // Default
          enableFurigana: true, // Default
          enableTerminology: true, // Default
          maxRetries: 3,
          timeout: 30000,
        },
        expect.any(Array) // Should load terminology by default
      );
    });

    it('should handle segment matching during update', async () => {
      const multipleSegments = [
        { ...mockSegments[0], id: 1, start: 0, end: 5 },
        { ...mockSegments[0], id: 2, start: 5, end: 10, text: 'Second segment' },
      ];

      const multipleProcessed = [
        { ...mockProcessedSegments[0], start: 0, end: 5 },
        {
          ...mockProcessedSegments[0],
          start: 5,
          end: 10,
          originalText: 'Second segment',
          normalizedText: 'Second segment',
        },
      ];

      mockDBUtils.getTranscript.mockResolvedValue(mockTranscript);
      mockDBUtils.getSegmentsByTranscriptId.mockResolvedValue(multipleSegments);
      mockDBUtils.updateSegment.mockResolvedValue(undefined);

      mockOpenRouterClient.postProcessSegments.mockResolvedValue(multipleProcessed);

      const request = new NextRequest('http://localhost/api/postprocess', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      await POST(request);

      // Both segments should be updated
      expect(mockDBUtils.updateSegment).toHaveBeenCalledTimes(2);
      expect(mockDBUtils.updateSegment).toHaveBeenNthCalledWith(1, 1, expect.any(Object));
      expect(mockDBUtils.updateSegment).toHaveBeenNthCalledWith(2, 2, expect.any(Object));
    });
  });

  describe('GET /api/postprocess', () => {
    const mockSegments = [
      {
        id: 1,
        transcriptId: 1,
        start: 0,
        end: 5,
        text: 'Original text',
        normalizedText: 'Normalized text',
        translation: 'Translation',
        annotations: ['annotation1'],
        furigana: 'Furigana',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        transcriptId: 1,
        start: 5,
        end: 10,
        text: 'No processing',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return post-processing status for transcript', async () => {
      mockDBUtils.getSegmentsByTranscriptId.mockResolvedValue(mockSegments);

      const request = new NextRequest('http://localhost/api/postprocess?transcriptId=1');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.transcriptId).toBe(1);
      expect(data.data.hasPostProcessing).toBe(true);
      expect(data.data.segmentCount).toBe(2);
      expect(data.data.processedSegments).toBe(1); // Only first segment has normalizedText
      expect(data.data.segments).toEqual(mockSegments);
    });

    it('should return false for hasPostProcessing when no segments processed', async () => {
      const unprocessedSegments = [
        {
          id: 1,
          transcriptId: 1,
          start: 0,
          end: 5,
          text: 'Original text only',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockDBUtils.getSegmentsByTranscriptId.mockResolvedValue(unprocessedSegments);

      const request = new NextRequest('http://localhost/api/postprocess?transcriptId=1');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.hasPostProcessing).toBe(false);
      expect(data.data.processedSegments).toBe(0);
    });

    it('should return 400 if transcriptId parameter is missing', async () => {
      const request = new NextRequest('http://localhost/api/postprocess');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('transcriptId parameter is required');
    });

    it('should return 400 if transcriptId is not a number', async () => {
      const request = new NextRequest('http://localhost/api/postprocess?transcriptId=invalid');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('transcriptId must be a number');
    });
  });

  describe('PATCH /api/postprocess', () => {
    const mockSegment = {
      id: 1,
      transcriptId: 1,
      start: 0,
      end: 5,
      text: 'Original text',
      normalizedText: 'Old normalized',
      translation: 'Old translation',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updateData = {
      normalizedText: 'New normalized text',
      translation: 'New translation',
      annotations: ['new', 'annotations'],
      furigana: 'New furigana',
    };

    it('should update segment successfully', async () => {
      const updatedSegment = { ...mockSegment, ...updateData };

      mockDBUtils.getSegment.mockResolvedValue(mockSegment);
      mockDBUtils.updateSegment.mockResolvedValue(undefined);
      mockDBUtils.getSegment.mockResolvedValueOnce(mockSegment).mockResolvedValueOnce(updatedSegment);

      const request = new NextRequest('http://localhost/api/postprocess?segmentId=1', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.segment).toEqual(updatedSegment);

      expect(mockDBUtils.updateSegment).toHaveBeenCalledWith(1, updateData);
    });

    it('should validate update data', async () => {
      const invalidUpdate = {
        normalizedText: 123, // Should be string
        translation: 'Valid translation',
      };

      const request = new NextRequest('http://localhost/api/postprocess?segmentId=1', {
        method: 'PATCH',
        body: JSON.stringify(invalidUpdate),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 if segmentId parameter is missing', async () => {
      const request = new NextRequest('http://localhost/api/postprocess', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('segmentId parameter is required');
    });

    it('should return 400 if segmentId is not a number', async () => {
      const request = new NextRequest('http://localhost/api/postprocess?segmentId=invalid', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('segmentId must be a number');
    });

    it('should return 404 if segment not found', async () => {
      mockDBUtils.getSegment.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost/api/postprocess?segmentId=999', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should handle partial updates', async () => {
      const partialUpdate = {
        normalizedText: 'Only updating this field',
      };

      mockDBUtils.getSegment.mockResolvedValue(mockSegment);
      mockDBUtils.updateSegment.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost/api/postprocess?segmentId=1', {
        method: 'PATCH',
        body: JSON.stringify(partialUpdate),
      });

      await PATCH(request);

      expect(mockDBUtils.updateSegment).toHaveBeenCalledWith(1, partialUpdate);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in POST request', async () => {
      const request = new NextRequest('http://localhost/api/postprocess', {
        method: 'POST',
        body: '{ invalid json }',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle OpenRouter client errors', async () => {
      const mockTranscript = {
        id: 1,
        fileId: 1,
        status: 'completed',
        rawText: 'Test',
        language: 'ja',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSegments = [
        {
          id: 1,
          transcriptId: 1,
          start: 0,
          end: 5,
          text: 'Test segment',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockDBUtils.getTranscript.mockResolvedValue(mockTranscript);
      mockDBUtils.getSegmentsByTranscriptId.mockResolvedValue(mockSegments);
      mockOpenRouterClient.postProcessSegments.mockRejectedValue(
        new Error('OpenRouter API error')
      );

      const request = new NextRequest('http://localhost/api/postprocess', {
        method: 'POST',
        body: JSON.stringify({ transcriptId: 1 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});