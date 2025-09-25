import { DbUtils } from "@/lib/db";
import { TranscriptionService } from "@/lib/transcription-service";

// Helper function for test failures
function fail(message: string) {
  throw new Error(`Test failed: ${message}`);
}

// Mock fetch
global.fetch = jest.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn();

// Mock ArrayBuffer
global.ArrayBuffer = jest.fn().mockImplementation(() => ({}));
global.ArrayBuffer.isView = jest.fn().mockImplementation((arg) => {
  return (
    arg?.constructor &&
    (arg.constructor.name === "Uint8Array" ||
      arg.constructor.name === "Int8Array" ||
      arg.constructor.name === "Uint16Array" ||
      arg.constructor.name === "Int16Array" ||
      arg.constructor.name === "Uint32Array" ||
      arg.constructor.name === "Int32Array" ||
      arg.constructor.name === "Float32Array" ||
      arg.constructor.name === "Float64Array" ||
      arg.constructor.name === "DataView")
  );
});

// Mock Uint8Array
global.Uint8Array = class MockUint8Array {
  constructor(bufferOrArray) {
    if (bufferOrArray instanceof ArrayBuffer) {
      this.buffer = bufferOrArray;
    } else if (Array.isArray(bufferOrArray)) {
      this.buffer = new ArrayBuffer(bufferOrArray.length);
    }
  }
};

// Mock DbUtils
jest.mock("@/lib/db", () => ({
  DbUtils: {
    getFile: jest.fn(),
    getTranscriptsByFileId: jest.fn(),
    addTranscript: jest.fn(),
    updateTranscript: jest.fn(),
    getTranscript: jest.fn(),
    getFileTranscripts: jest.fn(),
    getAllTerms: jest.fn(),
    addSegments: jest.fn(),
    getSegmentsByTranscriptId: jest.fn(),
  },
}));

// Mock AudioProcessor
jest.mock("@/lib/audio-processor", () => ({
  processAudioFile: jest.fn(),
  getAudioDuration: jest.fn(),
  mergeAudioChunks: jest.fn(),
}));

// Mock Blob and ArrayBuffer
global.Blob = class Blob {
  constructor(parts, options) {
    this.parts = parts;
    this.options = options;
  }
  async arrayBuffer() {
    return new ArrayBuffer(1024);
  }
};

describe("Transcription Service", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // 确保数据库初始化
    const { db } = await import("@/lib/db");
    await db.open();
  });

  describe("transcribeAudio", () => {
    test("should start transcription for valid file", async () => {
      // Arrange
      const mockFile = {
        id: 123,
        name: "test.mp3",
        blob: new Blob(["audio content"]),
      };
      const mockTranscripts = [];
      const mockTranscriptId = 456;

      DbUtils.getFile.mockResolvedValue(mockFile);
      DbUtils.getTranscriptsByFileId.mockResolvedValue(mockTranscripts);
      DbUtils.addTranscript.mockResolvedValue(mockTranscriptId);

      // Mock AudioProcessor responses
      const {
        processAudioFile,
        getAudioDuration,
        mergeAudioChunks,
      } = require("@/lib/audio-processor");
      processAudioFile.mockResolvedValue([
        {
          index: 0,
          blob: new Blob(["audio content"]),
          startTime: 0,
          endTime: 45,
          duration: 45,
        },
      ]);
      getAudioDuration.mockResolvedValue(60);
      mergeAudioChunks.mockResolvedValue(new Blob(["merged audio content"]));

      // Mock successful API response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {
            text: "transcribed text",
            duration: 60,
            segments: [],
            segmentCount: 0,
            processingTime: 1000,
          },
        }),
      });

      // Act
      const result = await TranscriptionService.transcribeAudio(123, {
        language: "ja",
      });

      // Assert
      expect(result).toEqual({
        text: "transcribed text",
        duration: 60,
        segments: [],
        segmentCount: 0,
        processingTime: 1000,
      });
      expect(DbUtils.getFile).toHaveBeenCalledWith(123);

      // Check that fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining('"language":"ja"'),
      });
      expect(global.fetch).toHaveBeenCalledWith("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining('"chunkSeconds":45'),
      });
      expect(global.fetch).toHaveBeenCalledWith("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining('"overlap":0.2'),
      });
    });

    test("should return existing completed transcript", async () => {
      // Arrange
      const mockFile = {
        id: 123,
        name: "test.mp3",
        blob: new Blob(["audio content"]),
      };
      const mockTranscriptResult = {
        text: "existing transcript",
        duration: 60,
        segments: [],
        segmentCount: 0,
        processingTime: 1000,
      };

      DbUtils.getFile.mockResolvedValue(mockFile);

      // Mock successful API response for existing transcript processing
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: mockTranscriptResult }),
      });

      // Act
      const result = await TranscriptionService.transcribeAudio(123);

      // Assert
      expect(result).toEqual(mockTranscriptResult);
      expect(global.fetch).toHaveBeenCalled();
    });

    test("should throw error for non-existent file", async () => {
      // Arrange
      DbUtils.getFile.mockResolvedValue(undefined);

      // Act & Assert
      try {
        await TranscriptionService.transcribeAudio(999);
        fail("Expected error to be thrown");
      } catch (error) {
        expect(error.message).toContain("文件未找到");
      }
    });

    test("should handle API errors during transcription", async () => {
      // Arrange
      const mockFile = {
        id: 123,
        name: "test.mp3",
        blob: new Blob(["audio content"]),
      };

      DbUtils.getFile.mockResolvedValue(mockFile);

      // Mock API error response
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: "API error" }),
      });

      // Act & Assert
      try {
        await TranscriptionService.transcribeAudio(123);
        fail("Expected error to be thrown");
      } catch (error) {
        expect(error.message).toContain("转录失败");
      }
    });

    test("should handle network errors during transcription", async () => {
      // Arrange
      const mockFile = {
        id: 123,
        name: "test.mp3",
        blob: new Blob(["audio content"]),
      };

      DbUtils.getFile.mockResolvedValue(mockFile);

      // Mock network error
      global.fetch.mockRejectedValueOnce(new Error("Network error"));

      // Act & Assert
      try {
        await TranscriptionService.transcribeAudio(123);
        fail("Expected error to be thrown");
      } catch (error) {
        expect(error.message).toContain("Network error");
      }
    });
  });

  describe("postProcessSegments", () => {
    test("should post-process completed transcript", async () => {
      // Arrange
      const mockTranscript = { id: 456, status: "completed", fileId: 123 };

      DbUtils.getTranscript.mockResolvedValue(mockTranscript);
      DbUtils.getSegmentsByTranscriptId.mockResolvedValue([
        { start: 0, end: 5, text: "Hello world" },
        { start: 5, end: 10, text: "How are you?" },
      ]);

      // Mock successful API response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { processedSegments: 2, segments: [] },
        }),
      });

      // Act
      const result = await TranscriptionService.postProcessSegmentsByTranscriptId(456, {
        targetLanguage: "en",
        enableAnnotations: true,
        enableFurigana: true,
        enableTerminology: true,
      });

      // Assert
      expect(result).toEqual({ processedSegments: 2, segments: [] });
      expect(DbUtils.getTranscript).toHaveBeenCalledWith(456);
      expect(global.fetch).toHaveBeenCalledWith("/api/postprocess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining('"targetLanguage":"en"'),
      });
      expect(global.fetch).toHaveBeenCalledWith("/api/postprocess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining('"enableAnnotations":true'),
      });
      expect(global.fetch).toHaveBeenCalledWith("/api/postprocess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining('"enableFurigana":true'),
      });
      expect(global.fetch).toHaveBeenCalledWith("/api/postprocess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining('"enableTerminology":true'),
      });
    });

    test("should throw error for non-existent transcript", async () => {
      // Arrange
      DbUtils.getTranscript.mockResolvedValue(undefined);

      // Act & Assert
      try {
        await TranscriptionService.postProcessSegmentsByTranscriptId(999);
        fail("Expected error to be thrown");
      } catch (error) {
        expect(error.message).toContain("Transcript not found");
      }
    });

    test("should throw error for incomplete transcript", async () => {
      // Arrange
      const mockTranscript = { id: 456, status: "processing", fileId: 123 };

      DbUtils.getTranscript.mockResolvedValue(mockTranscript);

      // Act & Assert
      try {
        await TranscriptionService.postProcessSegmentsByTranscriptId(456);
        fail("Expected error to be thrown");
      } catch (error) {
        expect(error.message).toContain("completed before post-processing");
      }
    });

    test("should handle API errors during post-processing", async () => {
      // Arrange
      const mockTranscript = { id: 456, status: "completed", fileId: 123 };

      DbUtils.getTranscript.mockResolvedValue(mockTranscript);
      DbUtils.getSegmentsByTranscriptId.mockResolvedValue([
        { start: 0, end: 5, text: "Hello world" },
      ]);

      // Mock API error response
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: "Post-processing error" }),
      });

      // Act & Assert
      try {
        await TranscriptionService.postProcessSegmentsByTranscriptId(456);
        fail("Expected error to be thrown");
      } catch (error) {
        expect(error.message).toContain("后处理失败");
      }
    });
  });

  describe("getFileTranscripts", () => {
    test("should return transcripts for file", async () => {
      // Arrange
      const mockTranscripts = [
        { id: 1, status: "completed" },
        { id: 2, status: "processing" },
      ];

      DbUtils.getTranscriptsByFileId.mockResolvedValue(mockTranscripts);

      // Act
      const transcripts = await TranscriptionService.getFileTranscripts(123);

      // Assert
      expect(transcripts).toEqual(mockTranscripts);
      expect(DbUtils.getTranscriptsByFileId).toHaveBeenCalledWith(123);
    });

    test("should rethrow database errors", async () => {
      // Arrange
      DbUtils.getTranscriptsByFileId.mockRejectedValue(new Error("Database error"));

      // Act & Assert
      try {
        await TranscriptionService.getFileTranscripts(123);
        fail("Expected error to be thrown");
      } catch (error) {
        expect(error.message).toContain("Database error");
      }
    });
  });

  // describe('progress tracking', () => {
  //   test('should track and update transcription progress', () => {
  //     // Arrange
  //     const progressCallback = jest.fn();

  //     // Act
  //     TranscriptionService.updateProgress(
  //       123,
  //       {
  //         status: 'processing',
  //         progress: 50,
  //         currentChunk: 2,
  //         totalChunks: 4,
  //       },
  //       { onProgress: progressCallback }
  //     );

  //     // Assert
  //     const progress = TranscriptionService.getTranscriptionProgress(123);
  //     expect(progress).toEqual({
  //       fileId: 123,
  //       status: 'processing',
  //       progress: 50,
  //       currentChunk: 2,
  //       totalChunks: 4,
  //     });
  //     expect(progressCallback).toHaveBeenCalledWith(progress);
  //   });

  //   test('should clear progress', () => {
  //     // Arrange
  //     TranscriptionService.updateProgress(123, { status: 'processing', progress: 50 });

  //     // Act & Assert
  //     const progress = TranscriptionService.getTranscriptionProgress(123);
  //     expect(progress).toBeUndefined();
  //   });

  //   test('should return undefined for non-existent progress', () => {
  //     // Act
  //     const progress = TranscriptionService.getTranscriptionProgress(999);

  //     // Assert
  //     expect(progress).toBeUndefined();
  //   });
  // });

  describe("transcribeAndPostProcess", () => {
    test("should complete transcription and post-processing", async () => {
      // Arrange
      const mockFile = {
        id: 123,
        name: "test.mp3",
        blob: new Blob(["audio content"]),
      };

      DbUtils.getFile.mockResolvedValue(mockFile);

      const mockTranscriptionResult = {
        text: "transcribed text",
        duration: 60,
        segments: [{ start: 0, end: 5, text: "Hello world" }],
        segmentCount: 1,
        processingTime: 1000,
      };

      const mockPostProcessResult = {
        processedSegments: 1,
        segments: [
          {
            start: 0,
            end: 5,
            text: "Hello world",
            normalizedText: "Hello world",
          },
        ],
      };

      // Mock API responses
      global.fetch
        .mockResolvedValueOnce({
          // Transcription API
          ok: true,
          json: jest.fn().mockResolvedValue({
            success: true,
            data: mockTranscriptionResult,
          }),
        })
        .mockResolvedValueOnce({
          // Post-processing API
          ok: true,
          json: jest.fn().mockResolvedValue({ success: true, data: mockPostProcessResult }),
        });

      // Act
      const result = await TranscriptionService.transcribeAndPostProcess(123);

      // Assert
      expect(result).toEqual({
        transcription: mockTranscriptionResult,
        postProcessed: mockPostProcessResult,
      });
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalledWith("/api/transcribe", expect.anything());
      expect(global.fetch).toHaveBeenCalledWith("/api/postprocess", expect.anything());
    });

    test("should handle errors during combined process", async () => {
      // Arrange
      const mockFile = {
        id: 123,
        name: "test.mp3",
        blob: new Blob(["audio content"]),
      };

      DbUtils.getFile.mockResolvedValue(mockFile);

      // Mock transcription error
      global.fetch.mockRejectedValue(new Error("Transcription error"));

      // Act & Assert
      try {
        await TranscriptionService.transcribeAndPostProcess(123);
        fail("Expected error to be thrown");
      } catch (error) {
        expect(error.message).toContain("Transcription error");
      }
    });
  });
});
