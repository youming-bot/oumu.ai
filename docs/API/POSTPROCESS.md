# 后处理 API 文档

本文档详细说明了文本后处理 API (`/api/postprocess`) 的使用方法、参数格式和响应结构。

## 概览

后处理 API 使用 OpenRouter 的语言模型对转录文本进行智能处理，包括分句规范化、翻译、注释生成等功能。

### 特性

- **智能分句**: 自动分段和标点修正
- **多语言翻译**: 支持多种语言互译
- **语法注释**: 自动生成语法结构说明
- **假名标注**: 支持假名和拼音标注
- **术语统一**: 应用自定义术语库
- **词级时间戳**: 保持精确的时间同步

## 端点信息

- **方法**: `POST`
- **路径**: `/api/postprocess`
- **内容类型**: `application/json`
- **认证**: 通过 API 密钥（服务端）

## 请求格式

### 请求体

```typescript
interface PostProcessRequest {
  fileId: string;                     // 文件唯一标识
  segments: RawSegment[];             // 原始分段数据
  targetLanguage?: string;            // 目标语言（默认: 'zh'）
  enableAnnotations?: boolean;        // 启用注释（默认: true）
  enableFurigana?: boolean;           // 启用假名（默认: true）
  enableTerminology?: boolean;        // 启用术语（默认: true）
}

interface RawSegment {
  start: number;                     // 开始时间（秒）
  end: number;                       // 结束时间（秒）
  text: string;                      // 原始文本
}
```

### 参数说明

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `fileId` | string | 是 | - | 文件唯一标识符 |
| `segments` | RawSegment[] | 是 | - | 原始分段数据 |
| `targetLanguage` | string | 否 | 'zh' | 目标语言代码 |
| `enableAnnotations` | boolean | 否 | true | 是否启用语法注释 |
| `enableFurigana` | boolean | 否 | true | 是否启用假名标注 |
| `enableTerminology` | boolean | 否 | true | 是否启用术语统一 |

### 语言支持

| 代码 | 语言 | 说明 |
|------|------|------|
| `zh` | 中文 | 简体中文 |
| `zh-tw` | 中文 | 繁体中文 |
| `en` | 英语 | 英语 |
| `ja` | 日语 | 日语 |
| `ko` | 韩语 | 韩语 |
| `es` | 西班牙语 | 西班牙语 |
| `fr` | 法语 | 法语 |
| `de` | 德语 | 德语 |

## 响应格式

### 成功响应

```typescript
interface PostProcessSuccessResponse {
  ok: true;
  data: {
    lang: string;                    // 检测到的源语言
    segments: ProcessedSegment[];     // 处理后的分段
    processingTime: number;          // 处理时间（毫秒）
  };
}

interface ProcessedSegment {
  id: number;                         // 分段ID
  start: number;                     // 开始时间
  end: number;                       // 结束时间
  text: string;                      // 原始文本
  normalizedText?: string;           // 规范化文本
  translation?: string;              // 翻译文本
  annotations?: string;              // 语法注释
  furigana?: string;                 // 假名标注
  wordTimestamps: WordTimestamp[];    // 词级时间戳
}

interface WordTimestamp {
  word: string;                      // 单词文本
  startTime: number;                  // 开始时间
  endTime: number;                    // 结束时间
  confidence?: number;                // 置信度
}
```

### 错误响应

```typescript
interface PostProcessErrorResponse {
  ok: false;
  error: {
    type: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}
```

## 处理功能

### 1. 智能分句

自动将连续文本分割为合理的句子：

```typescript
// 输入
{
  "text": "hello world this is a test sentence"
}

// 输出
{
  "segments": [
    {
      "text": "Hello world.",
      "normalizedText": "Hello world."
    },
    {
      "text": "This is a test sentence.",
      "normalizedText": "This is a test sentence."
    }
  ]
}
```

### 2. 文本规范化

自动修正标点符号和格式：

```typescript
// 输入
{
  "text": "hello   world"
}

// 输出
{
  "normalizedText": "Hello world."
}
```

### 3. 多语言翻译

支持多种语言之间的翻译：

```typescript
// 中文翻译
{
  "text": "Hello world",
  "targetLanguage": "zh",
  "translation": "你好世界"
}

// 日语翻译
{
  "text": "Hello world",
  "targetLanguage": "ja",
  "translation": "こんにちは世界"
}
```

### 4. 语法注释

自动生成语法结构说明：

```typescript
// 英语语法注释
{
  "text": "I am learning",
  "annotations": "主语 + be动词 + 现在分词"
}

// 日语语法注释
{
  "text": "私は勉強しています",
  "annotations": "主語 + 助詞 + 動詞 + います"
}
```

### 5. 假名标注

为日语和中文提供假名/拼音标注：

```typescript
// 日语假名
{
  "text": "日本語",
  "furigana": "にほんご"
}

// 中文拼音
{
  "text": "中文",
  "furigana": "zhōng wén"
}
```

### 6. 术语统一

应用自定义术语库确保翻译一致性：

```typescript
// 术语库示例
const terminology = {
  "shadowing": "影子跟读",
  "transcription": "转录",
  "segmentation": "分段"
};

// 应用术语
{
  "text": "shadowing learning",
  "translation": "影子跟读学习"
}
```

## 使用示例

### 基础使用

```typescript
async function postProcessSegments(
  fileId: string,
  segments: RawSegment[]
): Promise<ProcessedSegment[]> {
  const response = await fetch('/api/postprocess', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fileId,
      segments,
      targetLanguage: 'zh',
      enableAnnotations: true,
      enableFurigana: true,
      enableTerminology: true
    })
  });

  const result = await response.json();

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.data.segments;
}
```

### 高级使用

```typescript
class PostProcessingService {
  private apiClient: OumuAPIClient;

  constructor(baseURL: string) {
    this.apiClient = new OumuAPIClient(baseURL);
  }

  async processWithCustomOptions(
    fileId: string,
    segments: RawSegment[],
    options: PostProcessOptions
  ): Promise<ProcessingResult> {
    const request: PostProcessRequest = {
      fileId,
      segments,
      targetLanguage: options.targetLanguage || 'zh',
      enableAnnotations: options.enableAnnotations ?? true,
      enableFurigana: options.enableFurigana ?? true,
      enableTerminology: options.enableTerminology ?? true
    };

    const response = await this.apiClient.postProcess(request);

    return {
      segments: response.data.segments,
      detectedLanguage: response.data.lang,
      processingTime: response.data.processingTime
    };
  }

  async batchProcess(
    files: Array<{ fileId: string; segments: RawSegment[] }>,
    options: PostProcessOptions
  ): Promise<Map<string, ProcessingResult>> {
    const results = new Map<string, ProcessingResult>();

    // 并发处理多个文件
    const promises = files.map(async ({ fileId, segments }) => {
      try {
        const result = await this.processWithCustomOptions(
          fileId,
          segments,
          options
        );
        results.set(fileId, result);
      } catch (error) {
        console.error(`Failed to process file ${fileId}:`, error);
        results.set(fileId, {
          segments: [],
          detectedLanguage: 'unknown',
          processingTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    await Promise.all(promises);
    return results;
  }
}
```

### React Hook

```typescript
function usePostProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const postProcessSegments = useCallback(async (
    fileId: string,
    segments: RawSegment[],
    options: PostProcessOptions = {}
  ) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const service = new PostProcessingService('/api');

      const result = await service.processWithCustomOptions(
        fileId,
        segments,
        options
      );

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '后处理失败';
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    postProcessSegments,
    isProcessing,
    progress,
    error
  };
}
```

## 错误处理

### 常见错误

| 错误类型 | 说明 | 解决方案 |
|---------|------|----------|
| `VALIDATION_ERROR` | 请求参数验证失败 | 检查请求格式和参数 |
| `API_ERROR` | OpenRouter API 错误 | 检查API密钥和网络连接 |
| `PROCESSING_ERROR` | 文本处理失败 | 检查输入文本格式 |
| `RATE_LIMIT_ERROR` | 请求频率限制 | 降低请求频率 |
| `LANGUAGE_NOT_SUPPORTED` | 语言不支持 | 检查目标语言代码 |

### 错误处理示例

```typescript
class PostProcessingErrorHandler {
  static handle(error: any): never {
    if (error.type === 'VALIDATION_ERROR') {
      throw new PostProcessingError(
        '请求格式错误',
        'VALIDATION_ERROR',
        error.details
      );
    }

    if (error.type === 'API_ERROR') {
      if (error.details?.status === 429) {
        throw new PostProcessingError(
          '请求过于频繁，请稍后重试',
          'RATE_LIMIT_ERROR'
        );
      }

      throw new PostProcessingError(
        'AI服务暂时不可用',
        'API_ERROR'
      );
    }

    if (error.type === 'PROCESSING_ERROR') {
      throw new PostProcessingError(
        '文本处理失败',
        'PROCESSING_ERROR',
        error.details
      );
    }

    throw new PostProcessingError(
      '未知错误',
      'UNKNOWN_ERROR'
    );
  }
}

class PostProcessingError extends Error {
  constructor(
    message: string,
    public type: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PostProcessingError';
  }
}
```

## 性能优化

### 批量处理

```typescript
// 批量处理优化
class BatchPostProcessor {
  private queue: Array<{
    fileId: string;
    segments: RawSegment[];
    options: PostProcessOptions;
    resolve: (result: ProcessingResult) => void;
    reject: (error: Error) => void;
  }> = [];

  private processing = false;
  private batchSize = 5; // 每批处理5个文件

  async addToBatch(
    fileId: string,
    segments: RawSegment[],
    options: PostProcessOptions
  ): Promise<ProcessingResult> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fileId, segments, options, resolve, reject });

      if (!this.processing) {
        this.processBatch();
      }
    });
  }

  private async processBatch() {
    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);

      try {
        const promises = batch.map(async ({ fileId, segments, options, resolve, reject }) => {
          try {
            const result = await this.processSingle(fileId, segments, options);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });

        await Promise.all(promises);
      } catch (error) {
        // 批量处理失败，单独处理每个项目
        for (const item of batch) {
          try {
            const result = await this.processSingle(
              item.fileId,
              item.segments,
              item.options
            );
            item.resolve(result);
          } catch (error) {
            item.reject(error);
          }
        }
      }

      // 批次间延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.processing = false;
  }

  private async processSingle(
    fileId: string,
    segments: RawSegment[],
    options: PostProcessOptions
  ): Promise<ProcessingResult> {
    // 单个文件处理逻辑
    const response = await fetch('/api/postprocess', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileId,
        segments,
        ...options
      })
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.error.message);
    }

    return {
      segments: result.data.segments,
      detectedLanguage: result.data.lang,
      processingTime: result.data.processingTime
    };
  }
}
```

### 缓存策略

```typescript
// 结果缓存
class ProcessingCache {
  private cache = new Map<string, {
    result: ProcessingResult;
    timestamp: number;
  }>();

  private ttl = 30 * 60 * 1000; // 30分钟缓存

  get(key: string): ProcessingResult | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.result;
  }

  set(key: string, result: ProcessingResult): void {
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  generateKey(segments: RawSegment[], options: PostProcessOptions): string {
    const segmentsText = segments.map(s => s.text).join('|');
    const optionsStr = JSON.stringify(options);

    return createHash('md5')
      .update(segmentsText + optionsStr)
      .digest('hex');
  }
}
```

## 最佳实践

### 1. 请求优化

```typescript
// 请求优化建议
const optimizedRequest = {
  // 合并短段落
  segments: mergeShortSegments(segments, 10), // 合并小于10个字符的段落

  // 合理设置选项
  targetLanguage: 'zh',
  enableAnnotations: segments.length > 0,
  enableFurigana: segments.some(s => /[\u3040-\u309F\u4E00-\u9FFF]/.test(s.text)),
  enableTerminology: hasCustomTerminology()
};
```

### 2. 错误恢复

```typescript
// 错误恢复策略
async function resilientPostProcess(
  fileId: string,
  segments: RawSegment[],
  options: PostProcessOptions,
  maxRetries: number = 3
): Promise<ProcessingResult> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 随机延迟避免并发问题
      if (attempt > 1) {
        await new Promise(resolve =>
          setTimeout(resolve, Math.random() * 2000 + 1000)
        );
      }

      return await postProcessWithRetry(fileId, segments, options);
    } catch (error) {
      lastError = error as Error;

      // 特定错误类型的处理
      if (error.type === 'RATE_LIMIT_ERROR') {
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }

      if (error.type === 'API_ERROR' && attempt < maxRetries) {
        continue;
      }
    }
  }

  throw lastError!;
}
```

### 3. 进度反馈

```typescript
// 详细的进度反馈
interface ProcessingStep {
  name: string;
  weight: number;
  description: string;
}

const processingSteps: ProcessingStep[] = [
  { name: 'validation', weight: 10, description: '验证输入' },
  { name: 'segmentation', weight: 20, description: '文本分段' },
  { name: 'translation', weight: 30, description: '翻译处理' },
  { name: 'annotation', weight: 25, description: '生成注释' },
  { name: 'finalization', weight: 15, description: '最终处理' }
];

async function postProcessWithProgress(
  fileId: string,
  segments: RawSegment[],
  options: PostProcessOptions,
  onProgress: (step: string, progress: number) => void
): Promise<ProcessingResult> {
  let accumulatedProgress = 0;

  for (const step of processingSteps) {
    onProgress(step.name, accumulatedProgress);

    // 模拟步骤处理
    for (let i = 0; i <= 100; i += 10) {
      const stepProgress = accumulatedProgress + (step.weight * i / 100);
      onProgress(step.name, stepProgress);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    accumulatedProgress += step.weight;
  }

  onProgress('completed', 100);

  // 实际处理逻辑
  return postProcessSegments(fileId, segments, options);
}
```

---

*最后更新: 2024年9月24日*