# 架构设计文档

## 系统概述

Oumu.ai 采用**客户端优先的本地化架构**，实现了完整的音频转录、文本处理和语言学习功能。所有用户数据存储在本地 IndexedDB 中，通过流式处理与外部 AI 服务集成。

## 架构原则

### 1. 本地优先 (Local-First)
- **数据存储**: 所有用户数据存储在浏览器 IndexedDB 中
- **隐私保护**: 敏感数据不会上传到服务器
- **离线支持**: 支持离线使用和本地数据管理
- **用户控制**: 用户完全控制自己的数据

### 2. 微服务集成
- **Groq Whisper**: 高质量音频转录服务
- **OpenRouter**: 多种 LLM 模型支持
- **流式处理**: 音频文件流式传输，不落盘存储
- **API 抽象**: 统一的 API 客户端和错误处理

### 3. 响应式设计
- **现代 UI**: 基于 shadcn/ui 的响应式界面
- **渐进式增强**: PWA 支持和离线功能
- **无障碍**: 完整的 ARIA 支持和键盘导航
- **主题切换**: 深色/浅色模式支持

## 技术架构

### 1. 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     浏览器客户端                              │
├─────────────────────────────────────────────────────────────┤
│  UI Layer (React + shadcn/ui)                               │
│  ├── Audio Player                                           │
│  ├── File Manager                                           │
│  ├── Subtitle Display                                       │
│  └── Settings Panel                                          │
├─────────────────────────────────────────────────────────────┤
│  Logic Layer (Custom Hooks)                                 │
│  ├── useAppState (全局状态)                                 │
│  ├── useAudioPlayer (播放控制)                              │
│  ├── useFiles (文件管理)                                    │
│  ├── useTranscripts (转录管理)                              │
│  └── useTranscriptionProgress (进度跟踪)                   │
├─────────────────────────────────────────────────────────────┤
│  Data Layer (IndexedDB + Dexie)                            │
│  ├── FileRow (音频文件)                                     │
│  ├── TranscriptRow (转录结果)                               │
│  ├── Segment (分句处理)                                     │
│  └── WordTimestamp (词级时间戳)                             │
├─────────────────────────────────────────────────────────────┤
│  Service Layer (API Clients)                                │
│  ├── GroqClient (音频转录)                                  │
│  ├── OpenRouterClient (文本处理)                           │
│  └── ErrorHandler (错误处理)                                 │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    外部服务                                  │
├─────────────────────────────────────────────────────────────┤
│  Groq Whisper API (音频转录)                               │
│  OpenRouter API (文本处理)                                 │
│  CDN (静态资源)                                            │
└─────────────────────────────────────────────────────────────┘
```

### 2. 技术栈详细说明

#### 前端框架
- **Next.js 15**: 使用 App Router，支持 SSR 和静态生成
- **React 19**: 最新版本，支持并发特性
- **TypeScript 5.9**: 严格类型检查，提供类型安全
- **shadcn/ui**: 基于 Radix UI 的现代组件库

#### 数据管理
- **Dexie 4.2**: IndexedDB 封装，提供本地数据库功能
- **Zod 4.1**: 运行时类型验证和模式定义
- **React Hooks**: 状态管理和副作用处理
- **Query 模式**: 数据获取和缓存策略

#### 样式和UI
- **Tailwind CSS 4.1**: 原子化 CSS 框架
- **Lucide React**: 统一的图标系统
- **Framer Motion 12**: 动画和过渡效果
- **next-themes**: 主题切换支持

#### 开发工具
- **Biome.js 2.2**: 代码格式化和 linting
- **Jest 30.1**: 单元测试框架
- **React Testing Library**: 组件测试
- **fake-indexeddb**: 测试环境数据库模拟

## 数据模型设计

### 1. 核心实体关系

```
FileRow (1) ── (N) TranscriptRow (1) ── (N) Segment (1) ── (N) WordTimestamp
    │                │                │                │
    │                │                │                └── text, startTime, endTime
    │                │                └── start, end, text, translation
    │                └── rawText, segments, status
    └── name, size, blob, uploadedAt
```

### 2. 数据模型详细定义

#### FileRow (音频文件)
```typescript
interface FileRow {
  id: number;                    // 主键
  name: string;                 // 文件名
  size: number;                 // 文件大小
  type: string;                 // MIME类型
  blob: Blob;                   // 音频文件内容
  uploadedAt: Date;             // 上传时间
  duration?: number;            // 音频时长
  transcriptionStatus: ProcessingStatus; // 转录状态
}
```

#### TranscriptRow (转录结果)
```typescript
interface TranscriptRow {
  id: number;                    // 主键
  fileId: number;               // 关联文件ID
  rawText: string;              // 原始转录文本
  segments: Segment[];          // 分句处理结果
  processingStatus: ProcessingStatus; // 处理状态
  createdAt: Date;              // 创建时间
  updatedAt: Date;              // 更新时间
}
```

#### Segment (分句处理)
```typescript
interface Segment {
  id: number;                    // 主键
  transcriptId: number;         // 关联转录ID
  start: number;                // 开始时间(秒)
  end: number;                  // 结束时间(秒)
  text: string;                 // 原文文本
  normalizedText?: string;      // 规范化文本
  translation?: string;         // 翻译文本
  annotations?: string;         // 语法注释
  furigana?: string;            // 假名标注
  wordTimestamps: WordTimestamp[]; // 词级时间戳
}
```

#### WordTimestamp (词级时间戳)
```typescript
interface WordTimestamp {
  word: string;                 // 单词文本
  startTime: number;            // 开始时间(秒)
  endTime: number;              // 结束时间(秒)
  confidence?: number;          // 置信度
}
```

### 3. 数据库版本控制

#### Version 1 (基础结构)
- files 表：音频文件存储
- transcripts 表：转录结果
- segments 表：分句处理

#### Version 2 (时间戳支持)
- 添加 updatedAt 字段到所有表
- 优化查询索引

#### Version 3 (词级时间戳)
- segments 表添加 wordTimestamps 字段
- 支持精确的词级同步

## 状态管理模式

### 1. 分散式状态管理

项目采用基于 React Hooks 的分散式状态管理，每个功能模块有独立的状态管理：

```typescript
// 全局应用状态
useAppState() {
  return {
    theme: 'light' | 'dark',
    language: string,
    preferences: UserPreferences
  }
}

// 音频播放状态
useAudioPlayer() {
  return {
    currentTime: number,
    duration: number,
    isPlaying: boolean,
    playbackRate: number,
    // ... 播放控制方法
  }
}

// 文件管理状态
useFiles() {
  return {
    files: FileRow[],
    currentFile: FileRow | null,
    // ... 文件操作方法
  }
}
```

### 2. 状态更新模式

#### 单向数据流
```
用户操作 → Action → State Update → UI Re-render
```

#### 状态同步机制
- **IndexedDB 持久化**: 状态变化自动保存到本地数据库
- **实时同步**: 多个组件间的状态同步
- **缓存策略**: 智能缓存和失效机制

### 3. 错误处理策略

#### 统一错误处理
```typescript
// 错误分类
enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

// 错误处理流程
const handleError = (error: Error, context: string) => {
  // 1. 错误分类
  const errorType = classifyError(error);

  // 2. 上下文信息
  const appError = new AppError(errorType, error.message, context);

  // 3. 用户友好提示
  showUserMessage(appError);

  // 4. 错误上报
  reportError(appError);

  return appError;
};
```

## API 设计

### 1. RESTful API 设计

#### 转录 API
```typescript
POST /api/transcribe
Content-Type: multipart/form-data

// 请求参数
{
  audio: Blob,              // 音频文件
  meta: string,             // JSON元数据
}

// Query 参数
?fileId=string&chunkIndex=number&offsetSec=number

// 响应格式
{
  ok: boolean,
  chunkIndex: number,
  data: {
    text: string,
    segments: Segment[]
  }
}
```

#### 后处理 API
```typescript
POST /api/postprocess
Content-Type: application/json

// 请求体
{
  fileId: string,
  segments: RawSegment[],
  targetLanguage?: string,    // 默认: 'zh'
  enableAnnotations?: boolean, // 默认: true
  enableFurigana?: boolean,    // 默认: true
  enableTerminology?: boolean  // 默认: true
}

// 响应格式
{
  ok: boolean,
  data: {
    lang: string,
    segments: ProcessedSegment[]
  }
}
```

#### 进度查询 API
```typescript
GET /api/progress/[fileId]

// 响应格式
{
  progress: number,        // 0-100
  status: string,          // 'pending' | 'processing' | 'completed' | 'error'
  error?: string,         // 错误信息
  currentStep?: string    // 当前步骤
}
```

### 2. API 客户端设计

#### 统一 API 客户端
```typescript
class APIClient {
  private baseURL: string;
  private retryConfig: RetryConfig;

  async request<T>(endpoint: string, options: RequestOptions): Promise<T> {
    // 1. 请求拦截
    const request = this.interceptRequest(options);

    // 2. 重试机制
    return this.withRetry(async () => {
      const response = await fetch(this.baseURL + endpoint, request);

      // 3. 响应拦截
      return this.interceptResponse<T>(response);
    });
  }
}
```

#### 错误重试策略
```typescript
// 指数退避重试
const retryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2
};
```

## 性能优化策略

### 1. 音频处理优化

#### 分块处理
```typescript
// 45秒分块，0.2秒重叠
const CHUNK_SECONDS = 45;
const CHUNK_OVERLAP = 0.2;

// 并发控制
const MAX_CONCURRENCY = 3;
```

#### 流式传输
```typescript
// 直接流式传输到API，不落盘
async function* streamAudioToAPI(audioFile: File) {
  const stream = audioFile.stream();
  const reader = stream.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    yield value;
  }
}
```

### 2. 数据同步优化

#### 二分查找算法
```typescript
// O(log n) 时间复杂度的字幕同步
function findCurrentSegment(
  segments: Segment[],
  currentTime: number
): Segment | null {
  let left = 0;
  let right = segments.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const segment = segments[mid];

    if (currentTime >= segment.start && currentTime <= segment.end) {
      return segment;
    } else if (currentTime < segment.start) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  return null;
}
```

#### 虚拟滚动
```typescript
// 大量数据的高效渲染
const VirtualizedSubtitleList = React.memo(({ segments }) => {
  const { visibleItems, totalCount } = useVirtualList({
    items: segments,
    itemHeight: 40,
    overscan: 5
  });

  return (
    <div style={{ height: totalCount * 40 }}>
      {visibleItems.map(({ item, index }) => (
        <SubtitleItem key={item.id} segment={item} index={index} />
      ))}
    </div>
  );
});
```

### 3. 内存管理

#### 及时清理
```typescript
// 大文件清理
useEffect(() => {
  return () => {
    // 组件卸载时清理大文件
    if (currentFile?.size > 50 * 1024 * 1024) {
      cleanupLargeFile(currentFile.id);
    }
  };
}, [currentFile]);
```

## 安全性设计

### 1. 数据安全

#### 本地存储策略
```typescript
// 敏感数据本地存储
const secureStorage = {
  async set(key: string, value: any) {
    // 加密存储（可选）
    const encrypted = encrypt(value);
    await localDB.set(key, encrypted);
  },

  async get(key: string) {
    const encrypted = await localDB.get(key);
    return encrypted ? decrypt(encrypted) : null;
  }
};
```

#### API 密钥保护
```typescript
// 服务端环境变量
const config = {
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,

  // 客户端无法访问
  getClientConfig() {
    return {
      // 只返回客户端需要的配置
      MAX_CONCURRENCY: 3,
      CHUNK_SECONDS: 45
    };
  }
};
```

### 2. 输入验证

#### Zod 模式验证
```typescript
// 严格的输入验证
const TranscriptSchema = z.object({
  fileId: z.string(),
  segments: z.array(SegmentSchema),
  targetLanguage: z.string().optional(),
  enableAnnotations: z.boolean().default(true)
});

// 运行时验证
const validatedData = TranscriptSchema.parse(inputData);
```

#### XSS 防护
```typescript
// 使用 DOMPurify 净化用户输入
import DOMPurify from 'dompurify';

function sanitizeUserInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'span'],
    ALLOWED_ATTR: ['class']
  });
}
```

## 扩展性设计

### 1. 插件架构

#### 模块化设计
```typescript
// 服务插件化
interface ServicePlugin {
  name: string;
  process(input: any): Promise<any>;
  validate?(input: any): boolean;
}

// 插件注册
const serviceRegistry = {
  register(plugin: ServicePlugin) {
    this.plugins[plugin.name] = plugin;
  },

  async process(serviceName: string, input: any) {
    const plugin = this.plugins[serviceName];
    if (!plugin) throw new Error(`Service ${serviceName} not found`);

    return plugin.process(input);
  }
};
```

### 2. 配置驱动

#### 可配置的处理流程
```typescript
// 处理管道配置
interface ProcessingPipeline {
  steps: ProcessingStep[];
  concurrency: number;
  retryPolicy: RetryPolicy;
}

// 动态配置
const pipeline = createPipeline({
  steps: [
    { service: 'transcription', config: { model: 'whisper-large' } },
    { service: 'segmentation', config: { minLength: 10 } },
    { service: 'translation', config: { target: 'zh' } }
  ]
});
```

## 监控和诊断

### 1. 性能监控

#### 关键指标
```typescript
// 性能指标收集
const metrics = {
  audioProcessingTime: measureTime(audioProcessing),
  apiLatency: measureAPILatency(),
  syncAccuracy: measureSyncAccuracy(),
  memoryUsage: measureMemoryUsage()
};

// 实时监控
const performanceMonitor = {
  track(metric: string, value: number) {
    // 记录到本地存储
    this.metrics[metric].push(value);

    // 触发警报
    if (value > this.thresholds[metric]) {
      this.triggerAlert(metric, value);
    }
  }
};
```

### 2. 错误追踪

#### 错误报告
```typescript
// 错误收集和报告
const errorTracker = {
  capture(error: Error, context: any) {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };

    // 本地存储
    this.reports.push(errorReport);

    // 用户反馈
    this.showUserFeedback(errorReport);
  }
};
```

---

*最后更新: 2024年9月24日*