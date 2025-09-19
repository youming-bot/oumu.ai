import { toast } from 'sonner';
import { type AppError, type ErrorCode, ErrorCodes, getDefaultErrorMessage } from '@/types/errors';

// 创建错误
export function createError(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
  statusCode: number = 500
): AppError {
  return {
    code: ErrorCodes[code],
    message,
    details,
    statusCode,
  };
}

// 记录错误
export function logError(error: AppError, context?: string): void {
  const _logMessage = context
    ? `[${context}] ${error.code}: ${error.message}`
    : `${error.code}: ${error.message}`;

  // TODO: 集成错误监控服务 (Sentry, etc.)
}

// 检查是否为应用错误
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'statusCode' in error
  );
}

// 处理错误
export function handleError(error: unknown, context?: string): AppError {
  if (isAppError(error)) {
    logError(error, context);
    return error;
  }

  if (error instanceof Error) {
    const appError = createError('internalServerError', error.message, { stack: error.stack }, 500);
    logError(appError, context);
    return appError;
  }

  const appError = createError(
    'internalServerError',
    'Unknown error occurred',
    typeof error === 'object' && error !== null ? { error } : undefined,
    500
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
    return createError('internalServerError', error.message, { stack: error.stack }, 500);
  }

  return createError(
    'internalServerError',
    'Unknown error occurred',
    typeof error === 'object' && error !== null ? { error } : undefined,
    500
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
  return createError('apiValidationError', message, details, 400);
}

// 未找到错误
export function notFoundError(message: string, details?: Record<string, unknown>): AppError {
  return createError('dbRecordNotFound', message, details, 404);
}

// 内部服务器错误
export function internalError(message: string, details?: Record<string, unknown>): AppError {
  return createError('internalServerError', message, details, 500);
}

// 网络错误
export function networkError(
  message: string = 'Network error occurred',
  details?: Record<string, unknown>
): AppError {
  return createError('networkError', message, details, 503);
}

// 数据库错误
export function databaseError(message: string, details?: Record<string, unknown>): AppError {
  return createError('dbQueryFailed', message, details, 500);
}

// 文件上传错误
export function fileUploadError(message: string, details?: Record<string, unknown>): AppError {
  return createError('fileUploadFailed', message, details, 400);
}

// 音频处理错误
export function audioProcessingError(message: string, details?: Record<string, unknown>): AppError {
  return createError('audioProcessingError', message, details, 500);
}

// 转录错误
export function transcriptionError(message: string, details?: Record<string, unknown>): AppError {
  return createError('transcriptionFailed', message, details, 500);
}

// API错误
export function apiError(
  message: string,
  statusCode: number = 500,
  details?: Record<string, unknown>
): AppError {
  return createError('apiValidationError', message, details, statusCode);
}

// 处理并显示错误（UI友好的错误处理）
export function handleAndShowError(
  error: unknown,
  context?: string,
  customMessage?: string
): AppError {
  const appError = handleError(error, context);

  if (customMessage) {
    showErrorToast({ ...appError, message: customMessage });
  } else {
    showErrorToast(appError);
  }

  return appError;
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
};
