import { TranscriptionService } from "@/lib/transcription-service";

// Mock fetch API
global.fetch = jest.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => "blob:test-url");
global.URL.revokeObjectURL = jest.fn();

// Mock FormData
global.FormData = class FormData {
  constructor() {
    this.data = new Map();
  }
  append(key, value) {
    this.data.set(key, value);
  }
  get(key) {
    return this.data.get(key);
  }
  entries() {
    return this.data.entries();
  }
};

// Mock DbUtils with proper database mocking
jest.mock("@/lib/db", () => {
  // Mock database operations
  const mockDb = {
    files: {
      get: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      toArray: jest.fn(),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          first: jest.fn(),
          toArray: jest.fn(),
        })),
      })),
    },
    transcripts: {
      get: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      toArray: jest.fn(),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          first: jest.fn(),
          toArray: jest.fn(),
        })),
      })),
    },
    segments: {
      add: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      toArray: jest.fn(),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          first: jest.fn(),
          toArray: jest.fn(),
        })),
      })),
    },
    open: jest.fn(),
    close: jest.fn(),
    table: jest.fn(() => ({
      add: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      toArray: jest.fn(),
    })),
  };

  return {
    db: mockDb,
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
  };
});

// Mock AudioProcessor
jest.mock("@/lib/audio-processor", () => ({
  processAudioFile: jest.fn(),
  getAudioDuration: jest.fn(),
  mergeAudioChunks: jest.fn(),
}));

describe("Transcription Service - Fixed", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset all mock implementations
    if (global.fetch) {
      global.fetch.mockReset();
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("transcribeAudio", () => {
    test("should start transcription for valid file", async () => {
      // Arrange
      const mockFile = {
        id: 123,
        name: "test.mp3",
        blob: new Blob(["audio content"]),
        type: "audio/mp3",
        size: 1024 * 1024,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTranscript = {
        id: 456,
        fileId: 123,
        status: "completed" as const,
        rawText: "测试转录结果",
        processingStartedAt: new Date(),
        processingCompletedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock successful API response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          text: "测试转录结果",
          segments: [
            {
              start: 0,
              end: 2,
              text: "测试",
              words: [],
            },
          ],
        }),
      });

      // Mock database operations
      const { DbUtils } = require("@/lib/db");
      DbUtils.getFile.mockResolvedValue(mockFile);
      DbUtils.addTranscript.mockResolvedValue(mockTranscript);

      // Act
      const result = await TranscriptionService.transcribeAudio(mockFile.id);

      // Assert
      expect(result).toEqual(mockTranscript);
      expect(DbUtils.getFile).toHaveBeenCalledWith(mockFile.id);
      expect(DbUtils.addTranscript).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalled();
    });

    test("should return existing completed transcript", async () => {
      // Arrange
      const fileId = 123;
      const existingTranscript = {
        id: 456,
        fileId: 123,
        status: "completed" as const,
        rawText: "已有转录结果",
        processingStartedAt: new Date(),
        processingCompletedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { DbUtils } = require("@/lib/db");
      DbUtils.getFileTranscripts.mockResolvedValue([existingTranscript]);

      // Act
      const result = await TranscriptionService.transcribeAudio(fileId);

      // Assert
      expect(result).toEqual(existingTranscript);
      expect(DbUtils.getFileTranscripts).toHaveBeenCalledWith(fileId);
      expect(global.fetch).not.toHaveBeenCalled(); // Should not call API
    });

    test("should throw error for non-existent file", async () => {
      // Arrange
      const fileId = 999;
      const { DbUtils } = require("@/lib/db");
      DbUtils.getFile.mockResolvedValue(null);

      // Act & Assert
      await expect(TranscriptionService.transcribeAudio(fileId))
        .rejects.toThrow("文件不存在");
    });

    test("should handle API errors during transcription", async () => {
      // Arrange
      const mockFile = {
        id: 123,
        name: "test.mp3",
        blob: new Blob(["audio content"]),
        type: "audio/mp3",
        size: 1024 * 1024,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock API error
      global.fetch.mockRejectedValueOnce(new Error("网络错误"));

      const { DbUtils } = require("@/lib/db");
      DbUtils.getFile.mockResolvedValue(mockFile);

      // Act & Assert
      await expect(TranscriptionService.transcribeAudio(mockFile.id))
        .rejects.toThrow("转录失败: 网络错误");
    });

    test("should handle network errors during transcription", async () => {
      // Arrange
      const mockFile = {
        id: 123,
        name: "test.mp3",
        blob: new Blob(["audio content"]),
        type: "audio/mp3",
        size: 1024 * 1024,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock network error
      global.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      const { DbUtils } = require("@/lib/db");
      DbUtils.getFile.mockResolvedValue(mockFile);

      // Act & Assert
      await expect(TranscriptionService.transcribeAudio(mockFile.id))
        .rejects.toThrow();
    });
  });

  describe("postProcessSegments", () => {
    test("should post-process completed transcript", async () => {
      // Arrange
      const segments = [
        {
          start: 0,
          end: 2,
          text: "测试文本",
          words: [],
        },
      ];

      const processedSegments = [
        {
          ...segments[0],
          normalizedText: "测试文本（标准化）",
          annotations: ["名词"],
        },
      ];

      // Mock successful API response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          segments: processedSegments,
        }),
      });

      // Act
      const result = await TranscriptionService.postProcessSegments(
        123,
        segments
      );

      // Assert
      expect(result).toEqual(processedSegments);
      expect(global.fetch).toHaveBeenCalled();
    });

    test("should throw error for non-existent transcript", async () => {
      // Arrange
      const { DbUtils } = require("@/lib/db");
      DbUtils.getTranscript.mockResolvedValue(null);

      // Act & Assert
      await expect(
        TranscriptionService.postProcessSegments(999, [])
      ).rejects.toThrow("转录记录不存在");
    });

    test("should throw error for incomplete transcript", async () => {
      // Arrange
      const incompleteTranscript = {
        id: 456,
        fileId: 123,
        status: "processing" as const,
        rawText: "处理中",
        processingStartedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { DbUtils } = require("@/lib/db");
      DbUtils.getTranscript.mockResolvedValue(incompleteTranscript);

      // Act & Assert
      await expect(
        TranscriptionService.postProcessSegments(123, [])
      ).rejects.toThrow("转录未完成，无法进行后处理");
    });

    test("should handle API errors during post-processing", async () => {
      // Arrange
      const transcript = {
        id: 456,
        fileId: 123,
        status: "completed" as const,
        rawText: "已完成",
        processingStartedAt: new Date(),
        processingCompletedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const segments = [
        {
          start: 0,
          end: 2,
          text: "测试文本",
          words: [],
        },
      ];

      // Mock API error
      global.fetch.mockRejectedValueOnce(new Error("API错误"));

      const { DbUtils } = require("@/lib/db");
      DbUtils.getTranscript.mockResolvedValue(transcript);

      // Act & Assert
      await expect(
        TranscriptionService.postProcessSegments(123, segments)
      ).rejects.toThrow("后处理失败: API错误");
    });
  });

  describe("getFileTranscripts", () => {
    test("should return transcripts for file", async () => {
      // Arrange
      const fileId = 123;
      const expectedTranscripts = [
        {
          id: 456,
          fileId: 123,
          status: "completed" as const,
          rawText: "转录结果1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 457,
          fileId: 123,
          status: "failed" as const,
          rawText: "转录结果2",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const { DbUtils } = require("@/lib/db");
      DbUtils.getFileTranscripts.mockResolvedValue(expectedTranscripts);

      // Act
      const result = await TranscriptionService.getFileTranscripts(fileId);

      // Assert
      expect(result).toEqual(expectedTranscripts);
      expect(DbUtils.getFileTranscripts).toHaveBeenCalledWith(fileId);
    });

    test("should rethrow database errors", async () => {
      // Arrange
      const fileId = 123;
      const { DbUtils } = require("@/lib/db");
      DbUtils.getFileTranscripts.mockRejectedValue(new Error("数据库错误"));

      // Act & Assert
      await expect(TranscriptionService.getFileTranscripts(fileId))
        .rejects.toThrow("数据库错误");
    });
  });

  describe("transcribeAndPostProcess", () => {
    test("should complete transcription and post-processing", async () => {
      // Arrange
      const mockFile = {
        id: 123,
        name: "test.mp3",
        blob: new Blob(["audio content"]),
        type: "audio/mp3",
        size: 1024 * 1024,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTranscript = {
        id: 456,
        fileId: 123,
        status: "completed" as const,
        rawText: "测试转录结果",
        processingStartedAt: new Date(),
        processingCompletedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const segments = [
        {
          start: 0,
          end: 2,
          text: "测试文本",
          words: [],
        },
      ];

      const processedSegments = [
        {
          ...segments[0],
          normalizedText: "测试文本（标准化）",
        },
      ];

      // Mock API responses
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            text: "测试转录结果",
            segments: segments,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            segments: processedSegments,
          }),
        });

      const { DbUtils } = require("@/lib/db");
      DbUtils.getFile.mockResolvedValue(mockFile);
      DbUtils.addTranscript.mockResolvedValue(mockTranscript);
      DbUtils.getTranscript.mockResolvedValue(mockTranscript);
      DbUtils.addSegments.mockResolvedValue([1, 2, 3]);

      // Act
      const result = await TranscriptionService.transcribeAndPostProcess(mockFile.id);

      // Assert
      expect(result).toBeDefined();
      expect(DbUtils.getFile).toHaveBeenCalledWith(mockFile.id);
      expect(DbUtils.addTranscript).toHaveBeenCalled();
      expect(DbUtils.getTranscript).toHaveBeenCalledWith(456);
      expect(DbUtils.addSegments).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    test("should handle errors during combined process", async () => {
      // Arrange
      const mockFile = {
        id: 123,
        name: "test.mp3",
        blob: new Blob(["audio content"]),
        type: "audio/mp3",
        size: 1024 * 1024,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock API error
      global.fetch.mockRejectedValueOnce(new Error("处理错误"));

      const { DbUtils } = require("@/lib/db");
      DbUtils.getFile.mockResolvedValue(mockFile);

      // Act & Assert
      await expect(TranscriptionService.transcribeAndPostProcess(mockFile.id))
        .rejects.toThrow();
    });
  });
});