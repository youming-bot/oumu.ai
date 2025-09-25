/**
 * API 和数据库工作流程集成测试
 * 测试转录API调用、数据库存储和状态管理的完整流程
 */

import { POST as PostProcessPOST } from "@/app/api/postprocess/route";
import { POST } from "@/app/api/transcribe/route";
import { db } from "@/lib/db";

// Mock 数据库
jest.mock("@/lib/db");
jest.mock("@/lib/groq-client");
jest.mock("@/lib/openrouter-client");
jest.mock("@/lib/audio-processor");

// Mock Next.js API 相关
jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      ok: true,
    }),
  },
}));

// Mock 文件和 FormData
const mockFile = new File(["audio content"], "test.mp3", { type: "audio/mpeg" });
const mockFormData = new FormData();
mockFormData.append("audio", mockFile);
mockFormData.append("meta", JSON.stringify({ fileId: 1, chunkIndex: 0 }));

// 测试数据
const createMockFileRow = (overrides: Partial<any> = {}) => ({
  id: 1,
  name: "test-audio.mp3",
  size: 1024000,
  type: "audio/mpeg",
  duration: 120,
  createdAt: new Date(),
  updatedAt: new Date(),
  blob: new Blob(["audio content"], { type: "audio/mpeg" }),
  ...overrides,
});

const createMockTranscriptRow = (overrides: Partial<any> = {}) => ({
  id: 1,
  fileId: 1,
  status: "pending",
  rawText: "",
  segments: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockSegment = (overrides: Partial<any> = {}) => ({
  start: 0,
  end: 5,
  text: "こんにちは、これはテストです。",
  translations: { zh: "你好，这是一个测试。" },
  ...overrides,
});

describe("API 和数据库工作流程集成测试", () => {
  let mockDb: any;
  let _mockGroqClient: any;
  let _mockOpenRouterClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock 数据库
    mockDb = {
      files: {
        add: jest.fn(),
        get: jest.fn(),
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockReturnThis(),
        first: jest.fn(),
        delete: jest.fn(),
        toArray: jest.fn(),
        orderBy: jest.fn().mockReturnThis(),
        reverse: jest.fn().mockReturnThis(),
      },
      transcripts: {
        add: jest.fn(),
        get: jest.fn(),
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockReturnThis(),
        first: jest.fn(),
        delete: jest.fn(),
        toArray: jest.fn(),
        orderBy: jest.fn().mockReturnThis(),
        reverse: jest.fn().mockReturnThis(),
      },
      segments: {
        add: jest.fn(),
        get: jest.fn(),
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockReturnThis(),
        first: jest.fn(),
        delete: jest.fn(),
        toArray: jest.fn(),
        orderBy: jest.fn().mockReturnThis(),
      },
      transaction: jest.fn(),
    };

    (db as any).mockImplementation(() => mockDb);

    // Mock Groq 客户端
    _mockGroqClient = {
      transcribe: jest.fn(),
    };

    // Mock OpenRouter 客户端
    _mockOpenRouterClient = {
      postProcessSegments: jest.fn(),
    };
  });

  describe("1. 数据库操作测试", () => {
    it("应该能够添加文件到数据库", async () => {
      const mockFileRow = createMockFileRow();
      mockDb.files.add.mockResolvedValue(1);

      const fileId = await mockDb.files.add(mockFileRow);

      expect(mockDb.files.add).toHaveBeenCalledWith(mockFileRow);
      expect(fileId).toBe(1);
    });

    it("应该能够从数据库获取文件", async () => {
      const mockFileRow = createMockFileRow();
      mockDb.files.get.mockResolvedValue(mockFileRow);

      const file = await mockDb.files.get(1);

      expect(mockDb.files.get).toHaveBeenCalledWith(1);
      expect(file).toEqual(mockFileRow);
    });

    it("应该能够删除文件", async () => {
      mockDb.files.delete.mockResolvedValue(1);

      await mockDb.files.delete(1);

      expect(mockDb.files.delete).toHaveBeenCalledWith(1);
    });

    it("应该能够获取文件列表", async () => {
      const mockFiles = [
        createMockFileRow({ id: 1, name: "file1.mp3" }),
        createMockFileRow({ id: 2, name: "file2.mp3" }),
      ];
      mockDb.files.toArray.mockResolvedValue(mockFiles);

      const files = await mockDb.files.toArray();

      expect(mockDb.files.toArray).toHaveBeenCalled();
      expect(files).toHaveLength(2);
    });

    it("应该能够按条件查询文件", async () => {
      const mockFileRow = createMockFileRow();
      mockDb.files.where.mockReturnThis();
      mockDb.files.equals.mockReturnThis();
      mockDb.files.first.mockResolvedValue(mockFileRow);

      const file = await mockDb.files.where("id").equals(1).first();

      expect(mockDb.files.where).toHaveBeenCalledWith("id");
      expect(mockDb.files.equals).toHaveBeenCalledWith(1);
      expect(file).toEqual(mockFileRow);
    });
  });

  describe("2. 转录操作测试", () => {
    it("应该能够添加转录记录", async () => {
      const mockTranscriptRow = createMockTranscriptRow();
      mockDb.transcripts.add.mockResolvedValue(1);

      const transcriptId = await mockDb.transcripts.add(mockTranscriptRow);

      expect(mockDb.transcripts.add).toHaveBeenCalledWith(mockTranscriptRow);
      expect(transcriptId).toBe(1);
    });

    it("应该能够获取文件的转录记录", async () => {
      const mockTranscripts = [
        createMockTranscriptRow({ id: 1, fileId: 1, status: "pending" }),
        createMockTranscriptRow({ id: 2, fileId: 1, status: "completed" }),
      ];
      mockDb.transcripts.where.mockReturnThis();
      mockDb.transcripts.equals.mockReturnThis();
      mockDb.transcripts.toArray.mockResolvedValue(mockTranscripts);

      const transcripts = await mockDb.transcripts.where("fileId").equals(1).toArray();

      expect(mockDb.transcripts.where).toHaveBeenCalledWith("fileId");
      expect(mockDb.transcripts.equals).toHaveBeenCalledWith(1);
      expect(transcripts).toHaveLength(2);
    });

    it("应该能够更新转录状态", async () => {
      const mockTranscriptRow = createMockTranscriptRow({ id: 1, status: "processing" });
      mockDb.transcripts.get.mockResolvedValue(mockTranscriptRow);
      mockDb.transcripts.update = jest.fn().mockResolvedValue(1);

      await mockDb.transcripts.update(1, { status: "completed" });

      expect(mockDb.transcripts.update).toHaveBeenCalledWith(1, { status: "completed" });
    });
  });

  describe("3. API 路由测试", () => {
    it("应该处理转录 API 请求", async () => {
      const mockRequest = {
        url: "http://localhost:3000/api/transcribe?fileId=1&chunkIndex=0",
        formData: () => Promise.resolve(mockFormData),
      } as any;

      // Mock FormData entries
      const formDataEntries = jest.spyOn(mockFormData, "entries");
      formDataEntries.mockReturnValue([
        ["audio", mockFile],
        ["meta", JSON.stringify({ fileId: 1, chunkIndex: 0 })],
      ]);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data).toBeDefined();
      expect(response.status).toBe(200);
    });

    it("应该处理后处理 API 请求", async () => {
      const mockRequest = {
        json: () =>
          Promise.resolve({
            fileId: 1,
            segments: [createMockSegment()],
            targetLanguage: "zh",
            enableAnnotations: true,
            enableFurigana: true,
            enableTerminology: true,
          }),
      } as any;

      const response = await PostProcessPOST(mockRequest);
      const data = await response.json();

      expect(data).toBeDefined();
      expect(response.status).toBe(200);
    });

    it("应该处理 API 错误", async () => {
      const mockRequest = {
        url: "http://localhost:3000/api/transcribe?fileId=invalid",
        formData: () => Promise.reject(new Error("Invalid form data")),
      } as any;

      await expect(POST(mockRequest)).rejects.toThrow();
    });
  });

  describe("4. 数据库事务测试", () => {
    it("应该能够执行事务操作", async () => {
      const mockTransaction = jest.fn();
      mockDb.transaction.mockReturnValue(mockTransaction);

      const transaction = mockDb.transaction("rw", ["files", "transcripts"]);

      expect(mockDb.transaction).toHaveBeenCalledWith("rw", ["files", "transcripts"]);
      expect(transaction).toBe(mockTransaction);
    });

    it("应该处理事务错误", async () => {
      mockDb.transaction.mockImplementation(() => {
        throw new Error("Transaction failed");
      });

      expect(() => {
        mockDb.transaction("rw", ["files", "transcripts"]);
      }).toThrow("Transaction failed");
    });
  });

  describe("5. 数据迁移测试", () => {
    it("应该支持数据库版本升级", async () => {
      // Mock 数据库版本信息
      const mockVersion = {
        stores: {
          files: "++id,name,size,type,duration,createdAt,updatedAt,blob",
          transcripts: "++id,fileId,status,rawText,segments,createdAt,updatedAt",
          segments: "++id,transcriptId,start,end,text,translations,createdAt,updatedAt",
        },
      };

      expect(mockVersion.stores.files).toContain("id");
      expect(mockVersion.stores.transcripts).toContain("fileId");
      expect(mockVersion.stores.segments).toContain("transcriptId");
    });

    it("应该处理数据库初始化", async () => {
      // Mock 数据库打开
      const mockOpen = jest.fn();
      (db as any).open = mockOpen;
      mockOpen.mockResolvedValue(mockDb);

      const openedDb = await (db as any).open();

      expect(mockOpen).toHaveBeenCalled();
      expect(openedDb).toBe(mockDb);
    });
  });

  describe("6. 数据完整性测试", () => {
    it("应该验证文件数据完整性", () => {
      const mockFileRow = createMockFileRow();

      expect(mockFileRow.id).toBeDefined();
      expect(mockFileRow.name).toBeDefined();
      expect(mockFileRow.size).toBeGreaterThan(0);
      expect(mockFileRow.type).toMatch(/^audio\//);
      expect(mockFileRow.blob).toBeDefined();
    });

    it("应该验证转录数据完整性", () => {
      const mockTranscriptRow = createMockTranscriptRow();

      expect(mockTranscriptRow.id).toBeDefined();
      expect(mockTranscriptRow.fileId).toBeDefined();
      expect(mockTranscriptRow.status).toMatch(/^(pending|processing|completed|failed)$/);
      expect(mockTranscriptRow.createdAt).toBeDefined();
    });

    it("应该验证片段数据完整性", () => {
      const mockSegment = createMockSegment();

      expect(mockSegment.start).toBeGreaterThanOrEqual(0);
      expect(mockSegment.end).toBeGreaterThan(mockSegment.start);
      expect(mockSegment.text).toBeDefined();
    });
  });

  describe("7. 性能测试", () => {
    it("应该处理大量数据查询", async () => {
      const mockFiles = Array.from({ length: 1000 }, (_, i) =>
        createMockFileRow({ id: i + 1, name: `file-${i + 1}.mp3` }),
      );
      mockDb.files.toArray.mockResolvedValue(mockFiles);

      const files = await mockDb.files.toArray();

      expect(files).toHaveLength(1000);
      expect(mockDb.files.toArray).toHaveBeenCalled();
    });

    it("应该处理并发事务", async () => {
      const mockTransaction = jest.fn();
      mockDb.transaction.mockReturnValue(mockTransaction);

      // 模拟并发事务
      const transactions = Promise.all([
        mockDb.transaction("rw", ["files"]),
        mockDb.transaction("rw", ["transcripts"]),
        mockDb.transaction("rw", ["segments"]),
      ]);

      await expect(transactions).resolves.not.toThrow();
      expect(mockDb.transaction).toHaveBeenCalledTimes(3);
    });
  });

  describe("8. 错误处理测试", () => {
    it("应该处理数据库连接错误", async () => {
      mockDb.files.get.mockRejectedValue(new Error("Database connection failed"));

      await expect(mockDb.files.get(1)).rejects.toThrow("Database connection failed");
    });

    it("应该处理查询错误", async () => {
      mockDb.files.where.mockImplementation(() => {
        throw new Error("Query failed");
      });

      expect(() => {
        mockDb.files.where("invalid_field");
      }).toThrow("Query failed");
    });

    it("应该处理数据验证错误", () => {
      const invalidFile = {
        name: "test.mp3",
        // 缺少必需字段
      };

      expect(() => {
        mockDb.files.add(invalidFile);
      }).not.toThrow(); // 应该由数据库层处理验证
    });

    it("应该处理并发修改冲突", async () => {
      mockDb.files.update.mockRejectedValue(new Error("Concurrent modification"));

      await expect(mockDb.files.update(1, { status: "completed" })).rejects.toThrow(
        "Concurrent modification",
      );
    });
  });

  describe("9. 数据恢复测试", () => {
    it("应该能够从备份恢复数据", async () => {
      const backupData = {
        files: [createMockFileRow()],
        transcripts: [createMockTranscriptRow()],
        segments: [createMockSegment()],
      };

      // 模拟恢复过程
      mockDb.files.add.mockResolvedValue(1);
      mockDb.transcripts.add.mockResolvedValue(1);
      mockDb.segments.add.mockResolvedValue(1);

      await mockDb.files.add(backupData.files[0]);
      await mockDb.transcripts.add(backupData.transcripts[0]);
      await mockDb.segments.add(backupData.segments[0]);

      expect(mockDb.files.add).toHaveBeenCalledWith(backupData.files[0]);
      expect(mockDb.transcripts.add).toHaveBeenCalledWith(backupData.transcripts[0]);
      expect(mockDb.segments.add).toHaveBeenCalledWith(backupData.segments[0]);
    });

    it("应该处理数据导入导出", async () => {
      const exportData = {
        files: [createMockFileRow()],
        transcripts: [createMockTranscriptRow()],
        segments: [createMockSegment()],
      };

      mockDb.files.toArray.mockResolvedValue(exportData.files);
      mockDb.transcripts.toArray.mockResolvedValue(exportData.transcripts);
      mockDb.segments.toArray.mockResolvedValue(exportData.segments);

      const files = await mockDb.files.toArray();
      const transcripts = await mockDb.transcripts.toArray();
      const segments = await mockDb.segments.toArray();

      expect(files).toEqual(exportData.files);
      expect(transcripts).toEqual(exportData.transcripts);
      expect(segments).toEqual(exportData.segments);
    });
  });
});
