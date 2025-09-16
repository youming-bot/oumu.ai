# API 参考文档

## 概述

本文档详细描述了影子跟读项目的所有API接口，包括前端与后端的接口规范、请求响应格式、错误处理等。

## API 基础信息

### 基础URL
```
https://your-domain.com/api
```

### 认证方式
所有API请求使用Bearer Token认证：
```
Authorization: Bearer <API_KEY>
```

### 通用响应格式

**成功响应**:
```typescript
{
  ok: true,
  data: T,      // 具体数据
  metadata?: {  // 元数据(可选)
    total?: number,
    page?: number,
    pageSize?: number
  }
}
```

**错误响应**:
```typescript
{
  ok: false,
  error: {
    code: string,     // 错误代码
    message: string,  // 错误描述
    details?: any     // 错误详情(可选)
  }
}
```

### 通用错误代码

| 错误码 | 描述 | HTTP状态码 |
|--------|------|------------|
| `invalid_request` | 请求格式错误 | 400 |
| `unauthorized` | 未授权访问 | 401 |
| `forbidden` | 权限不足 | 403 |
| `not_found` | 资源不存在 | 404 |
| `rate_limited` | 频率限制 | 429 |
| `internal_error` | 服务器内部错误 | 500 |
| `service_unavailable` | 服务不可用 | 503 |

## 转录API

### POST /api/transcribe

音频转录接口，将音频文件发送到Groq Whisper进行语音转文字。

#### 请求参数

**Query Parameters**:
```typescript
interface QueryParams {
  fileId: string;      // 文件ID (必需)
  chunkIndex?: number; // 分片索引 (可选)
  offsetSec?: number;  // 时间偏移(秒) (可选)
}
```

**FormData 字段**:
```typescript
const formData = new FormData();
formData.append('audio', blob); // 音频Blob (必需)
formData.append('meta', JSON.stringify({
  fileId: string,     // 文件ID
  idx: number,        // 分片索引
  start: number,      // 开始时间(秒)
  end: number,        // 结束时间(秒)
  totalChunks: number // 总分片数
}));
```

#### 响应格式

**成功响应**:
```typescript
{
  ok: true,
  chunkIndex: number, // 处理的分片索引
  data: {
    text: string,     // 完整转录文本
    segments: Array<{
      start: number;   // 开始时间(秒)
      end: number;     // 结束时间(秒)
      text: string;    // 分段文本
      words?: Array<{  // 词级时间戳(可选)
        start: number;
        end: number;
        text: string;
      }>;
    }>;
  }
}
```

**错误响应**:
```typescript
{
  ok: false,
  error: {
    code: 'stt_429' | 'stt_5xx' | 'audio_too_large' | 'invalid_audio_format',
    message: string,
    details?: {
      chunkIndex?: number,
      fileId?: string,
      retryAfter?: number
    }
  }
}
```

#### 错误代码

| 错误码 | 描述 | 处理建议 |
|--------|------|----------|
| `stt_429` | Groq API频率限制 | 等待重试，使用指数退避 |
| `stt_5xx` | Groq服务错误 | 重试或联系管理员 |
| `audio_too_large` | 音频文件过大 | 分片处理或压缩 |
| `invalid_audio_format` | 不支持的音频格式 | 转换格式后重试 |

#### 示例

**请求**:
```bash
curl -X POST \
  'https://your-domain.com/api/transcribe?fileId=123e4567-e89b-12d3-a456-426614174000' \
  -H 'Authorization: Bearer your_api_key' \
  -F 'audio=@audio.wav' \
  -F 'meta={"fileId":"123e4567-e89b-12d3-a456-426614174000","idx":0,"start":0,"end":45,"totalChunks":3}'
```

**响应**:
```json
{
  "ok": true,
  "chunkIndex": 0,
  "data": {
    "text": "これはテスト音声です。",
    "segments": [
      {
        "start": 0.12,
        "end": 2.34,
        "text": "これは",
        "words": [
          {"start": 0.12, "end": 0.45, "text": "これ"},
          {"start": 0.46, "end": 0.67, "text": "は"}
        ]
      },
      {
        "start": 2.35,
        "end": 4.56,
        "text": "テスト音声です。"
      }
    ]
  }
}
```

## 后处理API

### POST /api/postprocess

文本后处理接口，使用OpenRouter对转录文本进行规范化处理。

#### 请求体

```typescript
{
  fileId: string; // 文件ID (必需)
  segments: Array<{ // 原始分段数据
    start: number;
    end: number;
    text: string;
  }>;
  glossary?: Array<{ // 术语库(可选)
    src: string;     // 源术语
    norm: string;    // 规范化术语
  }>;
  targetLangs: string[]; // 目标语言 ['zh', 'en'] (必需)
  preferReading: string; // 优先读音语言 'ja' (必需)
}
```

#### 响应格式

**成功响应**:
```typescript
{
  ok: true,
  data: {
    lang: string, // 主要语言代码
    segments: Array<{
      id: string;           // 分段ID
      start: number;        // 开始时间(秒)
      end: number;          // 结束时间(秒)
      text: string;         // 规范化文本
      lang?: string;        // 分段语言代码(可选)
      translation?: {       // 翻译结果(可选)
        zh?: string;        // 中文翻译
        en?: string;        // 英文翻译
      };
      reading?: string;     // 读音标注(可选)
      terms?: Array<{       // 术语处理记录(可选)
        src: string;        // 原始术语
        norm: string;       // 规范化术语
      }>;
      words?: Array<{       // 词级时间戳(可选)
        start: number;
        end: number;
        text: string;
      }>;
    }>
  }
}
```

**错误响应**:
```typescript
{
  ok: false,
  error: {
    code: 'openrouter_parse_error' | 'schema_validation_failed' | 'llm_timeout',
    message: string,
    details?: {
      segmentIndex?: number,
      validationErrors?: any[]
    }
  }
}
```

#### 错误代码

| 错误码 | 描述 | 处理建议 |
|--------|------|----------|
| `openrouter_parse_error` | OpenRouter解析失败 | 检查输入格式或重试 |
| `schema_validation_failed` | 数据验证失败 | 检查请求体格式 |
| `llm_timeout` | LLM处理超时 | 重试或减少处理量 |

#### 示例

**请求**:
```bash
curl -X POST \
  'https://your-domain.com/api/postprocess' \
  -H 'Authorization: Bearer your_api_key' \
  -H 'Content-Type: application/json' \
  -d '{
    "fileId": "123e4567-e89b-12d3-a456-426614174000",
    "segments": [
      {"start": 0.12, "end": 2.34, "text": "これはテスト"},
      {"start": 2.35, "end": 4.56, "text": "音声です"}
    ],
    "glossary": [
      {"src": "テスト", "norm": "测试"}
    ],
    "targetLangs": ["zh"],
    "preferReading": "ja"
  }'
```

**响应**:
```json
{
  "ok": true,
  "data": {
    "lang": "ja",
    "segments": [
      {
        "id": "seg-1",
        "start": 0.12,
        "end": 2.34,
        "text": "これはテストです。",
        "lang": "ja",
        "translation": {
          "zh": "这是测试。"
        },
        "reading": "これは てすと です",
        "terms": [
          {"src": "テスト", "norm": "测试"}
        ]
      },
      {
        "id": "seg-2",
        "start": 2.35,
        "end": 4.56,
        "text": "音声です。",
        "lang": "ja",
        "translation": {
          "zh": "是音频。"
        },
        "reading": "おんせい です"
      }
    ]
  }
}
```

## 健康检查API

### GET /api/health

服务健康状态检查接口。

#### 响应格式

```typescript
{
  status: 'healthy' | 'degraded' | 'unhealthy',
  timestamp: number,        // 时间戳
  version: string,          // 服务版本
  environment: string,      // 环境名称
  uptime: number,           // 运行时间(秒)
  services: {               // 依赖服务状态
    database: {
      status: 'healthy' | 'unhealthy',
      latency?: number
    };
    groq: {
      status: 'healthy' | 'unhealthy',
      latency?: number
    };
    openrouter: {
      status: 'healthy' | 'unhealthy',
      latency?: number
    };
  };
  metrics?: {               // 性能指标(可选)
    memoryUsage: number,
    cpuUsage: number,
    activeRequests: number
  }
}
```

#### 示例

**请求**:
```bash
curl 'https://your-domain.com/api/health'
```

**响应**:
```json
{
  "status": "healthy",
  "timestamp": 1726070400000,
  "version": "1.0.0",
  "environment": "production",
  "uptime": 86400,
  "services": {
    "database": {
      "status": "healthy",
      "latency": 12
    },
    "groq": {
      "status": "healthy",
      "latency": 245
    },
    "openrouter": {
      "status": "healthy",
      "latency": 567
    }
  },
  "metrics": {
    "memoryUsage": 45.2,
    "cpuUsage": 12.8,
    "activeRequests": 3
  }
}
```

## 文件管理API (前端)

### 文件上传

前端使用标准HTML5 File API进行文件上传，结合IndexedDB进行本地存储。

#### 上传流程

1. 用户选择或多个音频文件
2. 前端验证文件格式和大小
3. 生成文件元数据并存储到IndexedDB
4. 可选：预计算波形数据
5. 更新UI显示上传状态

#### 文件验证

```typescript
function validateFile(file: File): ValidationResult {
  const maxSize = 100 * 1024 * 1024; // 100MB
  const allowedTypes = [
    'audio/mpeg',    // MP3
    'audio/wav',     // WAV
    'audio/webm',    // WebM
    'audio/ogg',     // OGG
    'audio/m4a'      // M4A
  ];

  if (file.size > maxSize) {
    return { valid: false, error: 'FILE_TOO_LARGE' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'INVALID_FILE_TYPE' };
  }

  return { valid: true };
}
```

### 文件读取和播放

使用Web Audio API进行音频解码和播放控制。

```typescript
async function playAudio(blob: Blob): Promise<HTMLAudioElement> {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  
  audio.addEventListener('loadedmetadata', () => {
    console.log('Duration:', audio.duration);
  });
  
  audio.addEventListener('timeupdate', () => {
    // 更新播放进度和字幕同步
    updatePlaybackState(audio.currentTime);
  });
  
  return audio;
}
```

## 速率限制

### API速率限制

- **转录API**: 每分钟最多10次请求
- **后处理API**: 每分钟最多5次请求
- **健康检查**: 无限制

### 并发限制

- 同时处理的分片数量: 3个
- 同时进行的后处理任务: 2个

### 重试策略

- 首次失败: 立即重试
- 第二次失败: 2秒后重试
- 第三次失败: 4秒后重试
- 最大重试次数: 3次

## 数据格式说明

### 时间格式
所有时间值均以秒为单位，精确到毫秒（3位小数）。

### 语言代码
使用ISO 639-1语言代码：
- `ja`: 日语
- `zh`: 中文
- `en`: 英语
- `ko`: 韩语

### 音频格式支持
- MP3 (audio/mpeg)
- WAV (audio/wav) 
- WebM (audio/webm)
- OGG (audio/ogg)
- M4A (audio/m4a)

## 版本历史

### v1.0.0 (当前版本)
- 初始API版本
- 支持音频转录和后处理
- 基本错误处理和速率限制

### v1.1.0 (计划中)
- 批量处理支持
- 增强的监控指标
- 更详细的错误信息

## 故障排除

### 常见问题

1. **429错误**: 减少请求频率或增加分片大小
2. **音频格式错误**: 检查文件格式是否在支持列表中
3. **网络超时**: 检查网络连接或增加超时时间
4. **内存不足**: 减少并发处理数量

### 调试模式

设置环境变量 `DEBUG=true` 启用详细日志：
```bash
export DEBUG=true
npm run dev
```

日志将包含详细的请求响应信息和错误堆栈。

---

本文档持续更新，最新版本请参考项目文档目录。