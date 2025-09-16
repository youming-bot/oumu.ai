import { AppError, ErrorCodes, ErrorCode, getDefaultErrorMessage } from '@/types/errors';
import { toast } from 'sonner';

export class ErrorHandler {
  static createError(
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

  static logError(error: AppError, context?: string): void {
    const logMessage = context
      ? `[${context}] ${error.code}: ${error.message}`
      : `${error.code}: ${error.message}`;

    console.error(logMessage, error.details || '');

    // TODO: 集成错误监控服务 (Sentry, etc.)
  }

  static handleError(error: unknown, context?: string): AppError {
    if (this.isAppError(error)) {
      this.logError(error, context);
      return error;
    }

    if (error instanceof Error) {
      const appError = this.createError(
        'INTERNAL_SERVER_ERROR',
        error.message,
        { stack: error.stack },
        500
      );
      this.logError(appError, context);
      return appError;
    }

    const appError = this.createError(
      'INTERNAL_SERVER_ERROR',
      'Unknown error occurred',
      typeof error === 'object' && error !== null ? { error } : undefined,
      500
    );
    this.logError(appError, context);
    return appError;
  }

  static isAppError(error: unknown): error is AppError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error &&
      'statusCode' in error
    );
  }

  // Toast 通知方法
  static showErrorToast(error: AppError, customMessage?: string): void {
    const userMessage = customMessage || getDefaultErrorMessage(error.code);

    toast.error(userMessage, {
      description: error.message,
      duration: 5000,
    });
  }

  static showSuccessToast(message: string): void {
    toast.success(message, {
      duration: 3000,
    });
  }

  static showWarningToast(message: string, description?: string): void {
    toast.warning(message, {
      description,
      duration: 4000,
    });
  }

  static showInfoToast(message: string, description?: string): void {
    toast.info(message, {
      description,
      duration: 3000,
    });
  }

  // 常用的错误工厂方法
  static validationError(message: string, details?: Record<string, unknown>): AppError {
    return this.createError('API_VALIDATION_ERROR', message, details, 400);
  }

  static notFoundError(message: string, details?: Record<string, unknown>): AppError {
    return this.createError('DB_RECORD_NOT_FOUND', message, details, 404);
  }

  static internalError(message: string, details?: Record<string, unknown>): AppError {
    return this.createError('INTERNAL_SERVER_ERROR', message, details, 500);
  }

  static fileUploadError(message: string, details?: Record<string, unknown>): AppError {
    return this.createError('FILE_UPLOAD_FAILED', message, details, 400);
  }

  static transcriptionError(message: string, details?: Record<string, unknown>): AppError {
    return this.createError('TRANSCRIPTION_FAILED', message, details, 500);
  }

  static networkError(message: string, details?: Record<string, unknown>): AppError {
    return this.createError('NETWORK_ERROR', message, details, 503);
  }

  // 处理并显示错误
  static handleAndShowError(error: unknown, context?: string, customMessage?: string): AppError {
    const appError = this.handleError(error, context);
    this.showErrorToast(appError, customMessage);
    return appError;
  }

  // 静默处理错误（仅记录，不显示toast）
  static handleSilently(error: unknown, context?: string): AppError {
    const appError = this.handleError(error, context);
    // 仅记录，不显示toast
    return appError;
  }
}