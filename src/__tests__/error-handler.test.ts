import { ErrorHandler } from '@/lib/error-handler';
import { ErrorCodes } from '@/types/errors';

describe('ErrorHandler', () => {
  describe('createError', () => {
    it('should create AppError with correct structure', () => {
      const error = ErrorHandler.createError(
        'dbRecordNotFound',
        'File not found',
        { fileId: 123 },
        404
      );

      expect(error.code).toBe(ErrorCodes.dbRecordNotFound);
      expect(error.message).toBe('File not found');
      expect(error.details).toEqual({ fileId: 123 });
      expect(error.statusCode).toBe(404);
    });

    it('should create error with default status code', () => {
      const error = ErrorHandler.createError('internalServerError', 'Internal error');

      expect(error.statusCode).toBe(500);
    });
  });

  describe('handleError', () => {
    it('should handle AppError instances correctly', () => {
      const originalError = ErrorHandler.createError(
        'dbRecordNotFound',
        'File not found',
        { fileId: 123 },
        404
      );

      const handledError = ErrorHandler.handleError(originalError, 'test');

      expect(handledError).toBe(originalError);
      expect(handledError.code).toBe(ErrorCodes.dbRecordNotFound);
    });

    it('should handle standard Error instances', () => {
      const standardError = new Error('Database connection failed');
      const handledError = ErrorHandler.handleError(standardError, 'test');

      expect(handledError.code).toBe(ErrorCodes.internalServerError);
      expect(handledError.message).toBe('Database connection failed');
      expect(handledError.statusCode).toBe(500);
    });

    it('should handle unknown error types', () => {
      const unknownError = { some: 'weird object' };
      const handledError = ErrorHandler.handleError(unknownError, 'test');

      expect(handledError.code).toBe(ErrorCodes.internalServerError);
      expect(handledError.message).toBe('Unknown error occurred');
      expect(handledError.statusCode).toBe(500);
    });

    it('should include context in error handling', () => {
      const error = new Error('Test error');
      const handledError = ErrorHandler.handleError(error, 'test-context');

      expect(handledError.code).toBe(ErrorCodes.internalServerError);
    });
  });

  describe('isAppError', () => {
    it('should return true for AppError instances', () => {
      const appError = ErrorHandler.createError('dbRecordNotFound', 'File not found');

      expect(ErrorHandler.isAppError(appError)).toBe(true);
    });

    it('should return false for standard Error instances', () => {
      const standardError = new Error('Some error');
      expect(ErrorHandler.isAppError(standardError)).toBe(false);
    });

    it('should return false for non-error objects', () => {
      expect(ErrorHandler.isAppError({})).toBe(false);
      expect(ErrorHandler.isAppError(null)).toBe(false);
      expect(ErrorHandler.isAppError(undefined)).toBe(false);
      expect(ErrorHandler.isAppError('string')).toBe(false);
    });
  });

  describe('error factory methods', () => {
    it('should create validation errors', () => {
      const error = ErrorHandler.validationError('Invalid input', { field: 'name' });

      expect(error.code).toBe(ErrorCodes.apiValidationError);
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'name' });
    });

    it('should create not found errors', () => {
      const error = ErrorHandler.notFoundError('User not found', { userId: 456 });

      expect(error.code).toBe(ErrorCodes.dbRecordNotFound);
      expect(error.statusCode).toBe(404);
      expect(error.details).toEqual({ userId: 456 });
    });

    it('should create internal errors', () => {
      const error = ErrorHandler.internalError('Database error', { query: 'SELECT * FROM users' });

      expect(error.code).toBe(ErrorCodes.internalServerError);
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({ query: 'SELECT * FROM users' });
    });

    it('should create file upload errors', () => {
      const error = ErrorHandler.fileUploadError('Upload failed', { fileName: 'test.mp3' });

      expect(error.code).toBe(ErrorCodes.fileUploadFailed);
      expect(error.statusCode).toBe(400);
    });

    it('should create transcription errors', () => {
      const error = ErrorHandler.transcriptionError('Transcription failed', { fileId: 789 });

      expect(error.code).toBe(ErrorCodes.transcriptionFailed);
      expect(error.statusCode).toBe(500);
    });

    it('should create network errors', () => {
      const error = ErrorHandler.networkError('Connection failed', {
        url: 'https://api.example.com',
      });

      expect(error.code).toBe(ErrorCodes.networkError);
      expect(error.statusCode).toBe(503);
    });
  });

  describe('handleAndShowError', () => {
    it('should return AppError instance', () => {
      const error = new Error('Test error');
      const result = ErrorHandler.handleAndShowError(error, 'test');

      expect(result).toBeInstanceOf(Object);
      expect(result.code).toBe(ErrorCodes.internalServerError);
    });

    it('should accept custom message', () => {
      const error = new Error('Test error');
      const result = ErrorHandler.handleAndShowError(error, 'test', 'Custom error message');

      expect(result.message).toBe('Test error');
    });
  });

  describe('handleSilently', () => {
    it('should return AppError without showing toast', () => {
      const error = new Error('Silent error');
      const result = ErrorHandler.handleSilently(error, 'silent-test');

      expect(result.code).toBe(ErrorCodes.internalServerError);
      expect(result.message).toBe('Silent error');
    });
  });
});
