import type { NextRequest } from "next/server";
import { POST } from "../../../../../src/app/api/transcribe/route";

// Mock Next.js server components
jest.mock("next/server", () => ({
  NextRequest: jest.fn().mockImplementation((url, options) => {
    const urlObj = new URL(url);
    return {
      url,
      method: options?.method || "GET",
      headers: {
        get: jest.fn(),
      },
      nextUrl: {
        searchParams: urlObj.searchParams,
      },
      json: () => Promise.resolve(options?.body ? JSON.parse(options.body) : {}),
      text: () => Promise.resolve(options?.body || ""),
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

// Mock Groq SDK with factory function
jest.mock("groq-sdk", () => {
  const mockGroqTranscription = {
    text: "Test transcription",
    language: "en",
    duration: 1.5,
    segments: [
      {
        id: 0,
        seek: 0,
        start: 0,
        end: 1,
        text: "Test",
        tokens: [1, 2, 3],
        temperature: 0,
        avg_logprob: -0.5,
        compression_ratio: 1.5,
        no_speech_prob: 0.1,
      },
    ],
  };

  const mockGroqInstance = {
    audio: {
      transcriptions: {
        create: jest.fn().mockResolvedValue(mockGroqTranscription),
      },
    },
  };

  return {
    default: jest.fn().mockImplementation(() => mockGroqInstance),
  };
});

// Mock database
jest.mock("@/lib/db", () => ({
  db: {
    files: {
      get: jest.fn().mockResolvedValue({
        id: 1,
        name: "test.mp3",
        size: 1024,
        type: "audio/mpeg",
        blob: new Blob(["test content"]),
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    },
    transcripts: {
      where: jest.fn().mockReturnValue({
        equals: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(null),
        }),
      }),
      put: jest.fn().mockResolvedValue(1),
      update: jest.fn().mockResolvedValue(undefined),
    },
  },
}));

// Mock error handler
jest.mock("@/lib/error-handler", () => ({
  createError: jest.fn((code, message, details) => ({
    code,
    message,
    details,
  })),
  validationError: jest.fn((message, details) => ({
    code: "VALIDATION_ERROR",
    message,
    details,
  })),
  notFoundError: jest.fn((message) => ({
    code: "NOT_FOUND",
    message,
  })),
  internalError: jest.fn((message) => ({
    code: "INTERNAL_ERROR",
    message,
  })),
}));

describe("/api/transcribe", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the Groq client singleton
    const { resetGroqClient } = require("@/lib/groq-client");
    resetGroqClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST", () => {
    it("should handle valid transcription request", async () => {
      // Create test form data
      const formData = new FormData();
      const testFile = new File(["test audio content"], "test.mp3", {
        type: "audio/mpeg",
      });
      formData.append("audio", testFile);

      // Mock NextRequest with FormData
      const request = {
        url: "http://localhost:3000/api/transcribe?fileId=1",
        formData: () => Promise.resolve(formData),
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.status).toBe("completed");
      expect(data.data.text).toBe("Test transcription");
      expect(data.data.language).toBeDefined();
      expect(data.data.duration).toBe(1.5);
      expect(data.data.segments).toBeDefined();
      expect(Array.isArray(data.data.segments)).toBe(true);
    });

    it("should return error when no audio file is provided", async () => {
      const formData = new FormData();

      const request = {
        url: "http://localhost:3000/api/transcribe?fileId=1",
        formData: () => Promise.resolve(formData),
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return error when validation fails", async () => {
      const request = {
        url: "http://localhost:3000/api/transcribe", // Missing required fileId parameter
        formData: () => Promise.resolve(new FormData()),
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.details).toBeDefined();
    });

    it("should return 400 error for missing file parameter", async () => {
      const formData = new FormData();
      formData.append("audio", "not-a-file"); // Invalid file

      const request = {
        url: "http://localhost:3000/api/transcribe?fileId=1",
        formData: () => Promise.resolve(formData),
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should handle transcription errors", async () => {
      // Get the mock instance to make it fail
      const { default: GroqSDK } = require("groq-sdk");
      const mockInstance = GroqSDK();
      mockInstance.audio.transcriptions.create.mockRejectedValueOnce(
        new Error("Transcription failed"),
      );

      const formData = new FormData();
      const testFile = new File(["test audio content"], "test.mp3", {
        type: "audio/mpeg",
      });
      formData.append("audio", testFile);

      const request = {
        url: "http://localhost:3000/api/transcribe?fileId=1",
        formData: () => Promise.resolve(formData),
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("TRANSCRIPTION_FAILED");
    });

    it("should return existing transcript if already completed", async () => {
      const { db } = require("@/lib/db");
      db.transcripts.where.mockReturnValue({
        equals: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({
            id: 1,
            fileId: 1,
            status: "completed",
            rawText: "Existing transcription",
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        }),
      });

      const formData = new FormData();
      const testFile = new File(["test audio content"], "test.mp3", {
        type: "audio/mpeg",
      });
      formData.append("audio", testFile);

      const request = {
        url: "http://localhost:3000/api/transcribe?fileId=1",
        formData: () => Promise.resolve(formData),
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.result).toBe("Existing transcription");
    });
  });
});
