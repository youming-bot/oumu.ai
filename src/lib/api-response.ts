import { NextResponse } from 'next/server';
import { ErrorHandler } from '@/lib/error-handler';
import { AppError } from '@/types/errors';

export class ApiResponse {
  static success(data: unknown, status: number = 200) {
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    }, { status });
  }

  static error(error: AppError) {
    return NextResponse.json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      timestamp: new Date().toISOString(),
    }, { status: error.statusCode });
  }

  static fromError(error: unknown, context?: string) {
    const appError = ErrorHandler.handleError(error, context);
    return this.error(appError);
  }

  // 常用的成功响应
  static created(data: unknown) {
    return this.success(data, 201);
  }

  static noContent() {
    return new NextResponse(null, { status: 204 });
  }

  static accepted(data: unknown) {
    return this.success(data, 202);
  }

  // 常用的错误响应
  static badRequest(message: string, details?: Record<string, unknown>) {
    const error = ErrorHandler.validationError(message, details);
    return this.error(error);
  }

  static notFound(message: string, details?: Record<string, unknown>) {
    const error = ErrorHandler.notFoundError(message, details);
    return this.error(error);
  }

  static internalError(message: string, details?: Record<string, unknown>) {
    const error = ErrorHandler.internalError(message, details);
    return this.error(error);
  }

  static unauthorized(message: string = 'Unauthorized', details?: Record<string, unknown>) {
    const error = ErrorHandler.createError('API_AUTH_ERROR', message, details, 401);
    return this.error(error);
  }

  static forbidden(message: string = 'Forbidden', details?: Record<string, unknown>) {
    const error = ErrorHandler.createError('API_AUTH_ERROR', message, details, 403);
    return this.error(error);
  }

  static tooManyRequests(message: string = 'Too many requests', details?: Record<string, unknown>) {
    const error = ErrorHandler.createError('API_RATE_LIMIT', message, details, 429);
    return this.error(error);
  }

  static serviceUnavailable(message: string = 'Service unavailable', details?: Record<string, unknown>) {
    const error = ErrorHandler.createError('SERVICE_UNAVAILABLE', message, details, 503);
    return this.error(error);
  }
}