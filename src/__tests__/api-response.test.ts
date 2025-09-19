import { NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { ErrorHandler } from '@/lib/error-handler';
import { ErrorCodes } from '@/types/errors';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((data, options) => ({
      data,
      status: options?.status || 200,
    })),
  },
}));

describe('ApiResponse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success', () => {
    it('should create successful response with data', () => {
      const testData = { id: 1, name: 'test' };
      ApiResponse.success(testData);

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: true,
          data: testData,
          timestamp: expect.any(String),
        },
        { status: 200 }
      );
    });

    it('should create successful response with custom status', () => {
      const testData = { id: 1 };
      ApiResponse.success(testData, 201);

      expect(NextResponse.json).toHaveBeenCalledWith(expect.any(Object), { status: 201 });
    });
  });

  describe('error', () => {
    it('should create error response from AppError', () => {
      const appError = ErrorHandler.createError(
        'dbRecordNotFound',
        'File not found',
        { fileId: 123 },
        404
      );

      ApiResponse.error(appError);

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: false,
          error: {
            code: ErrorCodes.dbRecordNotFound,
            message: 'File not found',
            details: { fileId: 123 },
          },
          timestamp: expect.any(String),
        },
        { status: 404 }
      );
    });
  });

  describe('fromError', () => {
    it('should handle standard Error instances', () => {
      const error = new Error('Database connection failed');
      ApiResponse.fromError(error, 'test');

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCodes.internalServerError,
            message: 'Database connection failed',
          }),
        }),
        { status: 500 }
      );
    });

    it('should handle unknown error types', () => {
      const unknownError = { some: 'weird object' };
      ApiResponse.fromError(unknownError, 'test');

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCodes.internalServerError,
            message: 'Unknown error occurred',
          }),
        }),
        { status: 500 }
      );
    });
  });

  describe('convenience methods', () => {
    it('should create created response', () => {
      const data = { id: 1 };
      ApiResponse.created(data);

      expect(NextResponse.json).toHaveBeenCalledWith(expect.any(Object), { status: 201 });
    });

    it('should create bad request response', () => {
      ApiResponse.badRequest('Invalid input', { field: 'name' });

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCodes.apiValidationError,
            message: 'Invalid input',
          }),
        }),
        { status: 400 }
      );
    });

    it('should create not found response', () => {
      ApiResponse.notFound('User not found', { userId: 456 });

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCodes.dbRecordNotFound,
            message: 'User not found',
          }),
        }),
        { status: 404 }
      );
    });

    it('should create internal error response', () => {
      ApiResponse.internalError('Database error');

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCodes.internalServerError,
            message: 'Database error',
          }),
        }),
        { status: 500 }
      );
    });

    it('should create unauthorized response', () => {
      ApiResponse.unauthorized('Access denied');

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCodes.apiAuthError,
            message: 'Access denied',
          }),
        }),
        { status: 401 }
      );
    });

    it('should create forbidden response', () => {
      ApiResponse.forbidden('Forbidden operation');

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCodes.apiAuthError,
            message: 'Forbidden operation',
          }),
        }),
        { status: 403 }
      );
    });

    it('should create too many requests response', () => {
      ApiResponse.tooManyRequests('Rate limit exceeded');

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCodes.apiRateLimit,
            message: 'Rate limit exceeded',
          }),
        }),
        { status: 429 }
      );
    });

    it('should create service unavailable response', () => {
      ApiResponse.serviceUnavailable('Service down');

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCodes.serviceUnavailable,
            message: 'Service down',
          }),
        }),
        { status: 503 }
      );
    });
  });
});
