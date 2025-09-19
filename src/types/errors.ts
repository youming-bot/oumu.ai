export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  statusCode: number;
}

export const ErrorCodes = {
  // 数据库错误
  dbConnectionFailed: 'DB_CONNECTION_FAILED',
  dbQueryFailed: 'DB_QUERY_FAILED',
  dbRecordNotFound: 'DB_RECORD_NOT_FOUND',
  dbMigrationFailed: 'DB_MIGRATION_FAILED',
  dbIntegrityError: 'DB_INTEGRITY_ERROR',

  // API 错误
  apiValidationError: 'API_VALIDATION_ERROR',
  apiAuthError: 'API_AUTH_ERROR',
  apiRateLimit: 'API_RATE_LIMIT',
  apiTimeout: 'API_TIMEOUT',

  // 文件处理错误
  fileUploadFailed: 'FILE_UPLOAD_FAILED',
  fileNotFound: 'FILE_NOT_FOUND',
  fileProcessingError: 'FILE_PROCESSING_ERROR',

  // 转录处理错误
  transcriptionFailed: 'TRANSCRIPTION_FAILED',
  transcriptionTimeout: 'TRANSCRIPTION_TIMEOUT',
  postProcessingFailed: 'POST_PROCESSING_FAILED',

  // 音频处理错误
  audioProcessingError: 'AUDIO_PROCESSING_ERROR',
  audioFormatUnsupported: 'AUDIO_FORMAT_UNSUPPORTED',

  // 业务逻辑错误
  invalidOperation: 'INVALID_OPERATION',
  resourceBusy: 'RESOURCE_BUSY',
  concurrencyLimit: 'CONCURRENCY_LIMIT',
  fileAlreadyProcessed: 'FILE_ALREADY_PROCESSED',

  // 系统错误
  internalServerError: 'INTERNAL_SERVER_ERROR',
  serviceUnavailable: 'SERVICE_UNAVAILABLE',
  networkError: 'NETWORK_ERROR',
  configurationError: 'CONFIGURATION_ERROR',
} as const;

export type ErrorCode = keyof typeof ErrorCodes;

// 用户友好的错误消息映射
export const UserFriendlyMessages: Record<string, string> = {
  DB_CONNECTION_FAILED: '数据库连接失败，请检查网络连接',
  DB_RECORD_NOT_FOUND: '请求的资源不存在',
  FILE_UPLOAD_FAILED: '文件上传失败，请重试',
  FILE_NOT_FOUND: '文件不存在',
  TRANSCRIPTION_FAILED: '音频转录失败，请检查音频质量',
  POST_PROCESSING_FAILED: '文本处理失败，请稍后重试',
  API_RATE_LIMIT: '请求过于频繁，请稍后再试',
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  INTERNAL_SERVER_ERROR: '系统内部错误，请联系技术支持',
  SERVICE_UNAVAILABLE: '服务暂时不可用，请稍后再试',
};

// 默认错误消息
export const getDefaultErrorMessage = (code: string): string => {
  return UserFriendlyMessages[code] || '发生未知错误，请重试';
};
