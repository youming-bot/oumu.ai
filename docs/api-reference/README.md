# API 参考文档

## 📋 API 概览

oumu.ai 提供了三个主要的 API 端点，用于音频转录、文本处理和进度跟踪。所有 API 都设计为无状态，支持流式处理，并具有完善的错误处理机制。

### API 端点

1. **`POST /api/transcribe`** - 音频转录
2. **`POST /api/postprocess`** - 文本后处理
3. **`GET /api/progress/[fileId]`** - 进度跟踪

### 认证和安全

- **API 密钥**: 所有外部 API 密钥仅在服务器端使用
- **CORS**: 严格配置的跨域访问控制
- **速率限制**: 防止 API 滥用
- **输入验证**: 使用 Zod 进行运行时验证

---

## 🎵 `/api/transcribe` - 音频转录 API

### 端点信息

- **方法**: `POST`
- **路径**: `/api/transcribe`
- **认证**: 无（通过 API 密钥内部认证）
- **内容类型**: `application/json`

### 请求体

```typescript
interface TranscribeRequest {
  fileData: {
    name: string;
    size: number;
    type: string;
    arrayBuffer: {
      type: 'Buffer';
      data: number[];
    };
  };
  language?: string; // 默认: 'auto'
  chunks?: Array<{
    startTime: number;
    endTime: number;
    duration: number;
    arrayBuffer: {
      type: 'Buffer';
      data: number[];
    };
  }>;
  chunkSeconds?: number; // 默认: 45
  overlap?: number; // 默认: 0.2
}
```

### 请求示例

```json
{
  "fileData": {
    "name": "sample.mp3",
    "size": 1024000,
    "type": "audio/mpeg",
    "arrayBuffer": {
      "type": "Buffer",
      "data": [255, 216, 255, 224, 0, 16, 74, 70, 73, 70]
    }
  },
  "language": "ja",
  "chunks": [
    {
      "startTime": 0,
      "endTime": 45,
      "duration": 45,
      "arrayBuffer": {
        "type": "Buffer",
        "data": [255, 216, 255, 224, 0, 16, 74, 70, 73, 70]
      }
    }
  ],
  "chunkSeconds": 45,
  "overlap": 0.2
}
```

### 响应

#### 成功响应 (200)

```typescript
interface TranscribeResponse {
  success: true;
  data: {
    text: string;
    language?: string;
    duration?: number;
    segments?: Array<{
      start: number;
      end: number;
      text: string;
      wordTimestamps?: Array<{
        word: string;
        start: number;
        end: number;
      }>;
    }>;
    segmentCount: number;
    processingTime: number;
  };
  metadata?: {
    provider: 'huggingface';
    model: string;
    chunksProcessed: number;
    totalDuration: number;
  };
}
```

#### 示例响应

```json
{
  "success": true,
  "data": {
    "text": "こんにちは、これはテストです。",
    "language": "ja",
    "duration": 45.2,
    "segments": [
      {
        "start": 0.0,
        "end": 2.5,
        "text": "こんにちは、",
        "wordTimestamps": [
          {
            "word": "こんにちは",
            "start": 0.0,
            "end": 1.2
          },
          {
            "word": "、",
            "start": 1.2,
            "end": 1.5
          }
        ]
      }
    ],
    "segmentCount": 1,
    "processingTime": 3.2
  },
  "metadata": {
    "provider": "huggingface",
    "model": "whisper-large-v3",
    "chunksProcessed": 1,
    "totalDuration": 45.2
  }
}
```

#### 错误响应 (400/500)

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}
```

### 状态码

| 状态码 | 描述 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 413 | 文件太大 |
| 429 | 请求频率限制 |
| 500 | 服务器内部错误 |
| 503 | 外部服务不可用 |

### 处理流程

```
1. 接收音频文件数据
2. 验证输入参数
3. 处理音频分块（如果需要）
4. 调用 HuggingFace Whisper API
5. 生成单词级时间戳
6. 返回转录结果
```

---

## 📝 `/api/postprocess` - 文本后处理 API

### 端点信息

- **方法**: `POST`
- **路径**: `/api/postprocess`
- **认证**: 无（通过 API 密钥内部认证）
- **内容类型**: `application/json`

### 请求体

```typescript
interface PostProcessRequest {
  fileId: number;
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  targetLanguage?: string; // 默认: 'zh'
  enableAnnotations?: boolean; // 默认: true
  enableFurigana?: boolean; // 默认: true
  enableTerminology?: boolean; // 默认: true
}
```

### 请求示例

```json
{
  "fileId": 123,
  "segments": [
    {
      "start": 0.0,
      "end": 2.5,
      "text": "こんにちは、これはテストです。"
    }
  ],
  "targetLanguage": "zh",
  "enableAnnotations": true,
  "enableFurigana": true,
  "enableTerminology": true
}
```

### 响应

#### 成功响应 (200)

```typescript
interface PostProcessResponse {
  success: true;
  data: {
    segments: Array<{
      start: number;
      end: number;
      text: string;
      translation?: string;
      annotations?: Array<{
        type: 'grammar' | 'vocabulary' | 'pronunciation';
        content: string;
        explanation?: string;
      }>;
      furigana?: Array<{
        text: string;
        reading: string;
      }>;
      terminologyMatches?: Array<{
        term: string;
        reading: string;
        translation: string;
        examples?: Array<{
          sentence: string;
          translation: string;
        }>;
      }>;
    }>;
    processingTime: number;
  };
  metadata?: {
    provider: 'openrouter';
    model: string;
    segmentsProcessed: number;
    terminologyFound: number;
  };
}
```

#### 示例响应

```json
{
  "success": true,
  "data": {
    "segments": [
      {
        "start": 0.0,
        "end": 2.5,
        "text": "こんにちは、これはテストです。",
        "translation": "你好，这是一个测试。",
        "annotations": [
          {
            "type": "grammar",
            "content": "こんにちは - 问候语",
            "explanation": "用于日常问候的礼貌用语"
          }
        ],
        "furigana": [
          {
            "text": "こんにちは",
            "reading": "こんにちは"
          },
          {
            "text": "これは",
            "reading": "これは"
          }
        ],
        "terminologyMatches": [
          {
            "term": "こんにちは",
            "reading": "こんにちは",
            "translation": "你好",
            "examples": [
              {
                "sentence": "こんにちは、元気ですか？",
                "translation": "你好，你好吗？"
              }
            ]
          }
        ]
      }
    ],
    "processingTime": 1.8
  },
  "metadata": {
    "provider": "openrouter",
    model": "deepseek/deepseek-chat-v3.1:free",
    "segmentsProcessed": 1,
    "terminologyFound": 1
  }
}
```

### 处理流程

```
1. 接收转录文本段
2. 从数据库获取术语表
3. 调用 OpenRouter LLM 进行翻译和注释
4. 生成振假名
5. 匹配术语
6. 返回处理结果
```

---

## 📊 `/api/progress/[fileId]` - 进度跟踪 API

### 端点信息

- **方法**: `GET`
- **路径**: `/api/progress/[fileId]`
- **认证**: 无
- **参数**: `fileId` (路径参数)

### 响应

#### 成功响应 (200)

```typescript
interface ProgressResponse {
  success: true;
  data: {
    fileId: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number; // 0-100
    message?: string;
    error?: string;
    estimatedTimeRemaining?: number;
    processedChunks?: number;
    totalChunks?: number;
    lastUpdate: string;
  };
}
```

#### 示例响应

```json
{
  "success": true,
  "data": {
    "fileId": 123,
    "status": "processing",
    "progress": 65,
    "message": "正在处理音频分块",
    "estimatedTimeRemaining": 120,
    "processedChunks": 13,
    "totalChunks": 20,
    "lastUpdate": "2024-09-22T10:30:00Z"
  }
}
```

#### 错误响应 (404)

```json
{
  "success": false,
  "error": {
    "code": "FILE_NOT_FOUND",
    "message": "File not found",
    "timestamp": "2024-09-22T10:30:00Z"
  }
}
```

### 状态说明

| 状态 | 描述 |
|------|------|
| `pending` | 等待处理 |
| `processing` | 正在处理 |
| `completed` | 处理完成 |
| `failed` | 处理失败 |

---

## 🛡️ 错误处理

### 统一错误格式

```typescript
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}
```

### 错误代码

| 代码 | 描述 | HTTP 状态码 |
|------|------|-------------|
| `VALIDATION_ERROR` | 请求参数验证失败 | 400 |
| `FILE_TOO_LARGE` | 文件大小超过限制 | 413 |
| `UNSUPPORTED_FILE_TYPE` | 不支持的文件类型 | 400 |
| `RATE_LIMIT_EXCEEDED` | 请求频率限制 | 429 |
| `FILE_NOT_FOUND` | 文件不存在 | 404 |
| `TRANSCRIPTION_FAILED` | 转录失败 | 500 |
| `EXTERNAL_API_ERROR` | 外部 API 错误 | 502 |
| `INTERNAL_ERROR` | 服务器内部错误 | 500 |

### 重试策略

#### 指数退避重试

```typescript
const retryWithBackoff = async (
  fn: () => Promise<any>,
  maxRetries: number = 3,
  initialDelay: number = 1000
) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = initialDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

#### 重试条件

- 网络错误 (5xx, 网络超时)
- 外部 API 限流 (429)
- 临时性服务错误 (503)

---

## 🔄 客户端集成

### TypeScript 客户端示例

```typescript
// lib/api-client.ts
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  async transcribe(data: TranscribeRequest): Promise<TranscribeResponse> {
    const response = await fetch(`${this.baseUrl}/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async postProcess(data: PostProcessRequest): Promise<PostProcessResponse> {
    const response = await fetch(`${this.baseUrl}/postprocess`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getProgress(fileId: number): Promise<ProgressResponse> {
    const response = await fetch(`${this.baseUrl}/progress/${fileId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
```

### React Hook 集成

```typescript
// hooks/useTranscription.ts
export const useTranscription = (fileId: number) => {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const transcribe = useCallback(async (data: TranscribeRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.transcribe(data);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pollProgress = useCallback(async () => {
    try {
      const response = await apiClient.getProgress(fileId);
      setProgress(response.data);
      
      if (response.data.status === 'processing') {
        // 继续轮询
        setTimeout(pollProgress, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [fileId]);

  return { transcribe, progress, error, isLoading, pollProgress };
};
```

---

## 📈 性能优化

### 请求优化

1. **分块处理**: 大文件分成 45 秒块处理
2. **并发控制**: 最多 3 个并发请求
3. **流式处理**: 支持流式音频处理
4. **缓存策略**: 结果缓存和去重

### 监控指标

```typescript
interface ApiMetrics {
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  externalApiLatency: {
    huggingface: number;
    openrouter: number;
  };
  concurrentRequests: number;
}
```

---

## 🔒 安全考虑

### 输入验证

```typescript
// 使用 Zod 进行运行时验证
const transcribeSchema = z.object({
  fileData: z.object({
    name: z.string(),
    size: z.number().max(100 * 1024 * 1024), // 100MB
    type: z.string().regex(/^audio\//),
    arrayBuffer: z.object({
      type: z.literal('Buffer'),
      data: z.array(z.number()),
    }),
  }),
  language: z.string().optional(),
  chunkSeconds: z.number().min(1).max(300).optional(),
  overlap: z.number().min(0).max(1).optional(),
});
```

### 安全头部

```typescript
// 设置安全 HTTP 头部
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // 安全头部
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // CORS 头部
  response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}
```

---

*API 参考文档 | 版本: 1.0 | 最后更新: 2024年9月22日*