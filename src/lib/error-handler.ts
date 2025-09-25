import { toast } from "sonner";
import {
  type AppError,
  type ErrorCode,
  ErrorCodes,
  type ErrorContext,
  type ErrorMonitor,
  getDefaultErrorMessage,
  type ErrorStats as ImportedErrorStats,
} from "@/types/errors";
import { type RetryOptions, withRetry } from "./retry-utils";

// 错误日志级别
export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

// 错误监控接口扩展
export interface ExtendedErrorMonitor {
  logError(error: AppError, context?: ErrorContext): void;
  logInfo(message: string, context?: ErrorContext): void;
  logWarning(message: string, context?: ErrorContext): void;
  flush?(): Promise<void>;
}

// 本地存储的错误日志
export interface ErrorLogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  code?: string;
  context?: ErrorContext;
  stack?: string;
}

// 全局错误监控实例
let globalErrorMonitor: ErrorMonitor | null = null;

// 设置全局错误监控
export function setErrorMonitor(monitor: ErrorMonitor): void {
  globalErrorMonitor = monitor;
}

// 获取全局错误监控
export function getErrorMonitor(): ErrorMonitor | null {
  return globalErrorMonitor;
}

// 创建错误
export function createError(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
  statusCode: number = 500,
): AppError {
  return {
    code: ErrorCodes[code],
    message,
    details,
    statusCode,
  };
}

// 记录错误到控制台和监控服务
export function logError(error: AppError, context?: string): void {
  const errorContext: ErrorContext = {
    timestamp: Date.now(),
    component: context,
    additional: {
      ...(error.details || {}),
      stack: (error as any).stack,
    },
  };

  // 控制台输出
  const _logMessage = context
    ? `[${context}] ${error.code}: ${error.message}`
    : `${error.code}: ${error.message}`;

  // 发送到错误监控服务
  if (globalErrorMonitor) {
    globalErrorMonitor.logError(error, errorContext);
  }

  // 本地存储错误日志
  logErrorLocally(error, errorContext);
}

// 检查是否为应用错误
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    "statusCode" in error
  );
}

// 处理错误
export function handleError(error: unknown, context?: string): AppError {
  if (isAppError(error)) {
    logError(error, context);
    return error;
  }

  if (error instanceof Error) {
    const appError = createError("internalServerError", error.message, { stack: error.stack }, 500);
    logError(appError, context);
    return appError;
  }

  const appError = createError(
    "internalServerError",
    "Unknown error occurred",
    typeof error === "object" && error !== null ? { error } : undefined,
    500,
  );
  logError(appError, context);
  return appError;
}

// 静默处理错误（不记录日志）
export function handleSilently(error: unknown, _context?: string): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return createError("internalServerError", error.message, { stack: error.stack }, 500);
  }

  return createError(
    "internalServerError",
    "Unknown error occurred",
    typeof error === "object" && error !== null ? { error } : undefined,
    500,
  );
}

// 显示用户友好的错误消息
export function showErrorToast(error: AppError | unknown): void {
  const appError = isAppError(error) ? error : handleError(error);

  const userMessage = getDefaultErrorMessage(appError.code) || appError.message;
  toast.error(userMessage);
}

// 显示成功消息
export function showSuccessToast(message: string): void {
  toast.success(message);
}

// 验证错误
export function validationError(message: string, details?: Record<string, unknown>): AppError {
  return createError("apiValidationError", message, details, 400);
}

// 未找到错误
export function notFoundError(message: string, details?: Record<string, unknown>): AppError {
  return createError("dbRecordNotFound", message, details, 404);
}

// 内部服务器错误
export function internalError(message: string, details?: Record<string, unknown>): AppError {
  return createError("internalServerError", message, details, 500);
}

// 网络错误
export function networkError(
  message: string = "Network error occurred",
  details?: Record<string, unknown>,
): AppError {
  return createError("networkError", message, details, 503);
}

// 数据库错误
export function databaseError(message: string, details?: Record<string, unknown>): AppError {
  return createError("dbQueryFailed", message, details, 500);
}

// 文件上传错误
export function fileUploadError(message: string, details?: Record<string, unknown>): AppError {
  return createError("fileUploadFailed", message, details, 400);
}

// 音频处理错误
export function audioProcessingError(message: string, details?: Record<string, unknown>): AppError {
  return createError("audioProcessingError", message, details, 500);
}

// 转录错误
export function transcriptionError(message: string, details?: Record<string, unknown>): AppError {
  return createError("transcriptionFailed", message, details, 500);
}

// API错误
export function apiError(
  message: string,
  statusCode: number = 500,
  details?: Record<string, unknown>,
): AppError {
  return createError("apiValidationError", message, details, statusCode);
}

// 本地错误日志存储
function logErrorLocally(error: AppError, context: ErrorContext): void {
  try {
    const logs = getLocalErrorLogs();
    const entry: ErrorLogEntry = {
      id: generateErrorId(),
      timestamp: context.timestamp || Date.now(),
      level: LogLevel.ERROR,
      message: error.message,
      code: error.code,
      context,
      stack: (error as any).stack,
    };

    logs.push(entry);

    // 只保留最近的100条错误日志
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }

    localStorage.setItem("app_error_logs", JSON.stringify(logs));
  } catch (_storageError) {}
}

// 获取本地错误日志
export function getLocalErrorLogs(): ErrorLogEntry[] {
  try {
    const logs = localStorage.getItem("app_error_logs");
    return logs ? JSON.parse(logs) : [];
  } catch {
    return [];
  }
}

// 清除本地错误日志
export function clearLocalErrorLogs(): void {
  localStorage.removeItem("app_error_logs");
}

// 生成错误ID
function generateErrorId(): string {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 带重试的错误处理
export async function handleWithRetry<T>(
  fn: () => Promise<T>,
  retryOptions?: RetryOptions,
  context?: string,
): Promise<T> {
  const result = await withRetry(fn, {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2,
    onRetry: (error, attempt) => {
      const message = `操作失败，正在重试 (${attempt}/3): ${error.message}`;
      toast.warning(message);
    },
    ...retryOptions,
  });

  if (!result.success) {
    const appError = handleError(result.error, context);
    showErrorToast(appError);
    throw appError;
  }

  return result.data!;
}

// 处理并显示错误（UI友好的错误处理）
export function handleAndShowError(
  error: unknown,
  context?: string,
  customMessage?: string,
): AppError {
  const appError = handleError(error, context);

  if (customMessage) {
    showErrorToast({ ...appError, message: customMessage });
  } else {
    showErrorToast(appError);
  }

  return appError;
}

// 网络错误重试包装器
export async function fetchWithErrorHandling(
  url: string,
  options?: RequestInit & { retryOptions?: RetryOptions },
  context?: string,
): Promise<Response> {
  return handleWithRetry(
    async () => {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      return response;
    },
    options?.retryOptions,
    context,
  );
}

// 错误恢复工具
export async function withErrorRecovery<T>(
  fn: () => Promise<T>,
  recoveryFn: (error: AppError) => Promise<T>,
  context?: string,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const appError = handleError(error, context);

    try {
      return await recoveryFn(appError);
    } catch (recoveryError) {
      const recoveryAppError = handleError(recoveryError, `${context}_recovery`);
      showErrorToast(recoveryAppError);
      throw recoveryAppError;
    }
  }
}

// 错误统计和分析
interface ErrorStats {
  totalErrors: number;
  errorsByCode: Record<string, number>;
  errorsByComponent: Record<string, number>;
  lastErrorTime?: number;
  errorFrequency: number; // errors per hour
}

// 获取错误统计
export function getErrorStats(): ImportedErrorStats {
  const logs = getLocalErrorLogs();
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  const stats: ImportedErrorStats = {
    totalErrors: logs.length,
    errorsByCode: {},
    errorsByComponent: {},
    errorFrequency: 0,
  };

  if (logs.length > 0) {
    stats.lastErrorTime = logs[logs.length - 1].timestamp;

    // 计算最近一小时的错误频率
    const recentErrors = logs.filter((log) => log.timestamp > oneHourAgo);
    stats.errorFrequency = recentErrors.length;

    // 按错误代码统计
    logs.forEach((log) => {
      if (log.code) {
        stats.errorsByCode[log.code] = (stats.errorsByCode[log.code] || 0) + 1;
      }

      if (log.context?.component) {
        const component = log.context.component;
        stats.errorsByComponent[component] = (stats.errorsByComponent[component] || 0) + 1;
      }
    });
  }

  return stats;
}

// 批量错误处理
export async function handleBatchErrors<T>(
  operations: Array<() => Promise<T>>,
  options: {
    continueOnError?: boolean;
    batchSize?: number;
    retryOptions?: RetryOptions;
    context?: string;
  } = {},
): Promise<{
  results: Array<{ success: boolean; data?: T; error?: AppError }>;
  errors: AppError[];
}> {
  const { continueOnError = true, batchSize = 5, retryOptions, context } = options;

  const results: Array<{ success: boolean; data?: T; error?: AppError }> = [];
  const errors: AppError[] = [];

  // 分批处理
  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);

    const batchPromises = batch.map(async (operation, index) => {
      try {
        const result = await handleWithRetry(
          operation,
          retryOptions,
          `${context}_batch_${i + index}`,
        );
        return { success: true as const, data: result };
      } catch (error) {
        const appError = handleError(error, `${context}_batch_${i + index}`);
        errors.push(appError);
        return { success: false as const, error: appError };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // 如果配置为遇到错误停止，且有错误发生
    if (!continueOnError && errors.length > 0) {
      break;
    }
  }

  return { results, errors };
}

// 错误监控装饰器
export function withErrorMonitoring(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
): void {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: unknown[]) {
    const context = `${target.constructor.name}.${propertyKey}`;

    try {
      return await originalMethod.apply(this, args);
    } catch (error) {
      const appError = handleError(error, context);
      showErrorToast(appError);
      throw appError;
    }
  };
}

// 错误恢复Hook（React Hook的替代方案）
export function useErrorHandler() {
  return {
    handleError: (error: unknown, context?: string) => {
      return handleAndShowError(error, context);
    },
    showError: (message: string, context?: string) => {
      const error = createError("internalServerError", message);
      showErrorToast(error);
      logError(error, context);
    },
    showSuccess: (message: string) => {
      showSuccessToast(message);
    },
    withRetry: async <T>(fn: () => Promise<T>, options?: RetryOptions) => {
      return handleWithRetry(fn, options);
    },
  };
}

// 为了向后兼容，保留函数别名
export const ErrorHandler = {
  createError,
  logError,
  handleError,
  handleSilently,
  showErrorToast,
  showSuccessToast,
  validationError,
  notFoundError,
  internalError,
  networkError,
  databaseError,
  fileUploadError,
  audioProcessingError,
  transcriptionError,
  apiError,
  handleAndShowError,
  isAppError,
  handleWithRetry,
  fetchWithErrorHandling,
  withErrorRecovery,
  getErrorStats,
  handleBatchErrors,
  useErrorHandler,
  setErrorMonitor,
  getErrorMonitor,
};

// 重新导出类型、接口和枚举
export type { AppError, ErrorContext, LogLevel as ImportedLogLevel, RetryOptions };
