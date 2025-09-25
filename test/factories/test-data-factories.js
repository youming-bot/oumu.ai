/**
 * 测试数据工厂
 * 提供一致的测试数据生成函数
 */

// 文件数据工厂
export const createTestFile = (overrides = {}) => {
  const baseFile = {
    id: 'test-file-id',
    name: 'test-audio.mp3',
    size: 1024 * 1024, // 1MB
    type: 'audio/mpeg',
    duration: 180, // 3分钟
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
    blob: new Blob(['test content']),
    status: 'completed',
    progress: 100,
    ...overrides
  };

  return baseFile;
};

// 转录数据工厂
export const createTestTranscript = (overrides = {}) => {
  const baseTranscript = {
    id: 'test-transcript-id',
    fileId: 'test-file-id',
    status: 'completed',
    rawText: 'テストテキスト',
    segments: [
      {
        id: 'segment-1',
        start: 0,
        end: 5000,
        text: 'テストテキスト',
        translation: '测试文本',
        annotations: ['greeting'],
        wordTimestamps: [
          { word: 'テスト', start: 0, end: 1000 },
          { word: 'テキスト', start: 1000, end: 2000 }
        ]
      }
    ],
    processingStartedAt: new Date('2023-01-01T00:00:00.000Z'),
    processingCompletedAt: new Date('2023-01-01T00:05:00.000Z'),
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:05:00.000Z'),
    ...overrides
  };

  return baseTranscript;
};

// 数据库状态工厂
export const createDatabaseState = (overrides = {}) => {
  const baseState = {
    files: [],
    transcripts: [],
    ...overrides
  };

  return baseState;
};

// 错误对象工厂
export const createTestError = (overrides = {}) => {
  const baseError = new Error('Test error');
  Object.assign(baseError, {
    code: 'TEST_ERROR',
    statusCode: 500,
    details: {
      message: 'This is a test error',
      ...overrides.details
    },
    ...overrides
  });

  return baseError;
};

// API 响应工厂
export const createTestApiResponse = (overrides = {}) => {
  const baseResponse = {
    success: true,
    data: {},
    message: 'Success',
    ...overrides
  };

  return baseResponse;
};

// 处理状态工厂
export const createProcessingStatus = (overrides = {}) => {
  const baseStatus = {
    status: 'pending',
    progress: 0,
    chunks: [],
    errors: [],
    ...overrides
  };

  return baseStatus;
};

// 用户输入工厂
export const createTestUserInput = (overrides = {}) => {
  const baseInput = {
    text: '测试文本',
    language: 'zh',
    confidence: 0.95,
    ...overrides
  };

  return baseInput;
};

// 音频块工厂
export const createTestAudioChunk = (overrides = {}) => {
  const baseChunk = {
    index: 0,
    start: 0,
    end: 45,
    size: 1024 * 1024,
    status: 'completed',
    ...overrides
  };

  return baseChunk;
};

// 导出所有工厂
export default {
  createTestFile,
  createTestTranscript,
  createDatabaseState,
  createTestError,
  createTestApiResponse,
  createProcessingStatus,
  createTestUserInput,
  createTestAudioChunk
};