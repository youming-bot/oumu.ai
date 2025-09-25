/**
 * 错误处理器测试 - 覆盖核心错误处理功能
 */

import {
  createError,
  logError,
  isAppError,
  setErrorMonitor,
  getErrorMonitor,
  handleSilently,
  handleWithRetry,
  handleError,
  LogLevel,
} from "@/lib/error-handler";
import { ErrorCodes } from "@/types/errors";

// Mock toast from sonner
jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = mockLocalStorage;

describe("错误处理器测试", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    // Clear global error monitor
    setErrorMonitor(null);
  });

  describe("createError", () => {
    test("应该创建标准错误对象", () => {
      const error = createError("NETWORK_ERROR", "网络连接失败", { url: "https://example.com" });

      expect(error).toEqual({
        code: ErrorCodes.NETWORK_ERROR,
        message: "网络连接失败",
        details: { url: "https://example.com" },
        statusCode: 500,
      });
    });

    test("应该创建带有自定义状态码的错误", () => {
      const error = createError("VALIDATION_ERROR", "输入验证失败", { field: "email" }, 400);

      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: "email" });
    });

    test("应该创建没有详情的错误", () => {
      const error = createError("UNKNOWN_ERROR", "未知错误");

      expect(error.details).toBeUndefined();
    });
  });

  describe("isAppError", () => {
    test("应该识别正确的应用错误", () => {
      const appError = {
        code: ErrorCodes.NETWORK_ERROR,
        message: "网络错误",
        statusCode: 500,
      };

      expect(isAppError(appError)).toBe(true);
    });

    test("应该拒绝非对象", () => {
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
      expect(isAppError("string")).toBe(false);
      expect(isAppError(123)).toBe(false);
    });

    test("应该拒绝缺少必要字段的对象", () => {
      expect(isAppError({ code: "ERROR" })).toBe(false);
      expect(isAppError({ message: "错误" })).toBe(false);
      expect(isAppError({ statusCode: 500 })).toBe(false);
      expect(isAppError({})).toBe(false);
    });

    test("应该拒绝普通错误对象", () => {
      const normalError = new Error("普通错误");
      expect(isAppError(normalError)).toBe(false);
    });
  });

  describe("setErrorMonitor and getErrorMonitor", () => {
    test("应该设置和获取错误监控器", () => {
      const mockMonitor = {
        logError: jest.fn(),
        logInfo: jest.fn(),
        logWarning: jest.fn(),
      };

      setErrorMonitor(mockMonitor);
      expect(getErrorMonitor()).toBe(mockMonitor);
    });

    test("应该允许清除错误监控器", () => {
      const mockMonitor = {
        logError: jest.fn(),
        logInfo: jest.fn(),
        logWarning: jest.fn(),
      };

      setErrorMonitor(mockMonitor);
      expect(getErrorMonitor()).toBe(mockMonitor);

      setErrorMonitor(null);
      expect(getErrorMonitor()).toBeNull();
    });
  });

  describe("logError", () => {
    test("应该记录错误到监控器", () => {
      const mockMonitor = {
        logError: jest.fn(),
        logInfo: jest.fn(),
        logWarning: jest.fn(),
      };
      setErrorMonitor(mockMonitor);

      const error = createError("NETWORK_ERROR", "网络连接失败");

      logError(error, "TestComponent");

      expect(mockMonitor.logError).toHaveBeenCalled();
    });

    test("应该处理没有监控器的情况", () => {
      const error = createError("NETWORK_ERROR", "网络连接失败");

      // 确保没有监控器
      setErrorMonitor(null);

      expect(() => {
        logError(error, "TestComponent");
      }).not.toThrow();
    });
  });

  describe("handleSilently", () => {
    test("应该静默处理错误", () => {
      const error = new Error("静默错误");

      const result = handleSilently(error, "test-operation");

      expect(isAppError(result)).toBe(true);
      expect(result.message).toBe("静默错误");
    });

    test("应该处理应用错误", () => {
      const appError = createError("NETWORK_ERROR", "网络错误");

      const result = handleSilently(appError, "test-operation");

      expect(result).toBe(appError);
    });

    test("应该处理字符串错误", () => {
      const result = handleSilently("字符串错误", "test-operation");

      expect(isAppError(result)).toBe(true);
      expect(result.message).toBe("Unknown error occurred");
    });
  });

  describe("handleError", () => {
    test("应该处理应用错误", () => {
      const appError = createError("NETWORK_ERROR", "网络错误");

      const result = handleError(appError, "TestComponent");

      expect(result).toBe(appError);
    });

    test("应该处理普通错误", () => {
      const error = new Error("普通错误");

      const result = handleError(error, "TestComponent");

      expect(isAppError(result)).toBe(true);
      expect(result.message).toBe("普通错误");
    });

    test("应该处理未知错误类型", () => {
      const result = handleError("未知错误", "TestComponent");

      expect(isAppError(result)).toBe(true);
      expect(result.message).toBe("Unknown error occurred");
    });
  });

  describe("handleWithRetry", () => {
    test("应该处理成功的异步操作", async () => {
      const asyncFn = jest.fn().mockResolvedValue("success");

      const result = await handleWithRetry(asyncFn, undefined, "test");

      expect(result).toBe("success");
      expect(asyncFn).toHaveBeenCalled();
    });

    test("应该处理重试逻辑", async () => {
      const error = new Error("网络错误");
      const asyncFn = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue("success");

      const result = await handleWithRetry(asyncFn, { maxAttempts: 2 }, "test");

      expect(result).toBe("success");
      expect(asyncFn).toHaveBeenCalledTimes(2);
    }, 10000);
  });

  describe("错误级别", () => {
    test("应该导出正确的错误级别", () => {
      expect(LogLevel.ERROR).toBe("error");
      expect(LogLevel.WARN).toBe("warn");
      expect(LogLevel.INFO).toBe("info");
      expect(LogLevel.DEBUG).toBe("debug");
    });
  });

  describe("集成测试", () => {
    test("应该完整处理错误生命周期", () => {
      const mockMonitor = {
        logError: jest.fn(),
        logInfo: jest.fn(),
        logWarning: jest.fn(),
      };
      setErrorMonitor(mockMonitor);

      const error = createError("NETWORK_ERROR", "网络连接失败", { url: "https://example.com" });

      // 1. 创建错误
      expect(isAppError(error)).toBe(true);

      // 2. 记录错误
      logError(error, "TestComponent");

      // 3. 验证监控器被调用
      expect(mockMonitor.logError).toHaveBeenCalled();
    });

    test("应该处理复杂错误场景", () => {
      // 创建一个应用错误
      const originalError = createError("VALIDATION_ERROR", "验证失败", { field: "email" });

      // 使用 handleError 处理错误
      const handledError = handleError(originalError, "TestComponent");

      // 验证错误具有正确的结构
      expect(isAppError(handledError)).toBe(true);
      expect(handledError.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(handledError.details).toEqual({ field: "email" });

      // 测试静默处理
      const silentError = handleSilently(originalError, "TestComponent");
      expect(silentError).toBe(originalError);
    });
  });
});