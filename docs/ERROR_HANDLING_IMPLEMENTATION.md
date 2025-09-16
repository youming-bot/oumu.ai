# 错误处理统一实现指南

## 当前问题分析

现有代码库中的错误处理存在不一致性：
1. **错误响应格式不一致**：不同API返回的错误格式不同
2. **错误日志记录不统一**：有些使用console.error，有些直接抛出
3. **错误分类缺失**：没有明确的错误类型分类
4. **错误处理重复**：每个API都有类似的错误处理代码

## 统一错误处理方案

### 1. 错误类型定义 (`/src/types/errors.ts`)

```typescript
export interface AppError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

export const ErrorCodes = {
  // 数据库错误
  DB_CONNECTION_FAILED: 'DB_CONNECTION_FAILED',
  DB_QUERY_FAILED: 'DB_QUERY_FAILED',
  DB_RECORD_NOT_FOUND: 'DB_RECORD_NOT_FOUND',

  // API 错误
  API_VALIDATION_ERROR: 'API_VALIDATION_ERROR',
  API_AUTH_ERROR: 'API_AUTH_ERROR',
  API_RATE_LIMIT: 'API_RATE_LIMIT',

  // 业务逻辑错误
  FILE_ALREADY_PROCESSED: 'FILE_ALREADY_PROCESSED',
  TRANSCRIPTION_FAILED: 'TRANSCRIPTION_FAILED',
  PROCESSING_TIMEOUT: 'PROCESSING_TIMEOUT',

  // 系统错误
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = keyof typeof ErrorCodes;
```

### 2. 错误处理工具类 (`/src/lib/error-handler.ts`)

```typescript
import { AppError, ErrorCodes, ErrorCode } from '@/types/errors';

export class ErrorHandler {
  static createError(
    code: ErrorCode,
    message: string,
    details?: any,
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
      error,
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

  // 常用的错误工厂方法
  static validationError(message: string, details?: any): AppError {
    return this.createError('API_VALIDATION_ERROR', message, details, 400);
  }

  static notFoundError(message: string, details?: any): AppError {
    return this.createError('DB_RECORD_NOT_FOUND', message, details, 404);
  }

  static internalError(message: string, details?: any): AppError {
    return this.createError('INTERNAL_SERVER_ERROR', message, details, 500);
  }
}
```

### 3. API 错误响应包装器 (`/src/lib/api-response.ts`)

```typescript
import { NextResponse } from 'next/server';
import { AppError, ErrorHandler } from '@/lib/error-handler';

export class ApiResponse {
  static success(data: any, status: number = 200) {
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
}
```

## 实施步骤

### 步骤 1: 创建基础文件
1. 创建 `/src/types/errors.ts`
2. 创建 `/src/lib/error-handler.ts`
3. 创建 `/src/lib/api-response.ts`

### 步骤 2: 重构现有 API 路由

**示例：重构 `/src/app/api/transcribe/route.ts`**

```typescript
// 导入新的错误处理工具
import { ApiResponse, ErrorHandler } from '@/lib/api-response';
import { ErrorCodes } from '@/types/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = transcribeSchema.safeParse(body);

    if (!validation.success) {
      const error = ErrorHandler.validationError(
        'Invalid request data',
        validation.error.format()
      );
      return ApiResponse.error(error);
    }

    const { fileId, language, chunkSeconds, overlap } = validation.data;

    const file = await DBUtils.getFile(fileId);
    if (!file) {
      const error = ErrorHandler.notFoundError('File not found', { fileId });
      return ApiResponse.error(error);
    }

    // ... 其余逻辑保持不变

  } catch (error) {
    return ApiResponse.fromError(error, 'transcribe/POST');
  }
}
```

### 步骤 3: 重构数据库工具类

**示例：重构 `/src/lib/db.ts` 中的 DBUtils**

```typescript
static async getFile(id: number): Promise<FileRow> {
  try {
    const file = await db.files.get(id);
    if (!file) {
      throw ErrorHandler.createError(
        'DB_RECORD_NOT_FOUND',
        'File not found',
        { fileId: id },
        404
      );
    }
    return file;
  } catch (error) {
    if (ErrorHandler.isAppError(error)) {
      throw error;
    }
    throw ErrorHandler.handleError(error, 'DBUtils.getFile');
  }
}
```

### 步骤 4: 添加错误监控集成（可选）

```typescript
// 在 error-handler.ts 中添加
import * as Sentry from '@sentry/nextjs';

export class ErrorHandler {
  // ... 现有方法

  static logError(error: AppError, context?: string): void {
    const logMessage = context
      ? `[${context}] ${error.code}: ${error.message}`
      : `${error.code}: ${error.message}`;

    console.error(logMessage, error.details || '');

    // Sentry 集成
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(new Error(logMessage), {
        extra: {
          errorCode: error.code,
          details: error.details,
          context,
        },
      });
    }
  }
}
```

## 错误响应格式标准

### 成功响应
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "DB_RECORD_NOT_FOUND",
    "message": "File not found",
    "details": { "fileId": 123 }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 测试策略

### 单元测试 (`/src/__tests__/error-handler.test.ts`)

```typescript
import { ErrorHandler, ErrorCodes } from '@/lib/error-handler';

describe('ErrorHandler', () => {
  it('should create AppError with correct structure', () => {
    const error = ErrorHandler.createError(
      'DB_RECORD_NOT_FOUND',
      'File not found',
      { fileId: 123 },
      404
    );

    expect(error.code).toBe(ErrorCodes.DB_RECORD_NOT_FOUND);
    expect(error.message).toBe('File not found');
    expect(error.details).toEqual({ fileId: 123 });
    expect(error.statusCode).toBe(404);
  });

  it('should handle unknown errors', () => {
    const unknownError = { some: 'weird object' };
    const appError = ErrorHandler.handleError(unknownError, 'test');

    expect(appError.code).toBe(ErrorCodes.INTERNAL_SERVER_ERROR);
    expect(appError.statusCode).toBe(500);
  });
});
```

### API 错误测试

```typescript
describe('API Error Responses', () => {
  it('should return standardized error format for validation errors', async () => {
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
    });

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toHaveProperty('code');
    expect(data.error).toHaveProperty('message');
    expect(data).toHaveProperty('timestamp');
  });
});
```

## 迁移计划

1. **第一阶段**: 实现基础错误处理框架
2. **第二阶段**: 逐个API路由进行重构
3. **第三阶段**: 重构数据库工具类
4. **第四阶段**: 添加错误监控集成
5. **第五阶段**: 编写测试用例

## 注意事项

1. **向后兼容性**: 确保错误响应格式变化不会破坏现有客户端
2. **错误信息安全性**: 避免在生产环境中暴露敏感信息
3. **性能影响**: 错误处理不应显著影响应用性能
4. **日志管理**: 合理控制错误日志的输出级别和频率

通过实施统一的错误处理机制，将大大提高代码的可维护性和可靠性，同时为监控和调试提供更好的支持。