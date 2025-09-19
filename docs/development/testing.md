# 测试策略和覆盖计划

## 当前测试状态分析

现有测试覆盖：
- ✅ 基础测试框架配置 (Jest + Testing Library)
- ✅ 2个示例测试文件
- ⚠️ 核心功能测试覆盖不足
- ⚠️ API路由测试缺失
- ⚠️ 数据库操作测试缺失
- ⚠️ 工具函数测试缺失

## 测试覆盖率目标

| 组件类型 | 当前覆盖率 | 目标覆盖率 | 优先级 |
|----------|------------|------------|--------|
| 工具函数 (Utils) | ~0% | >90% | 高 |
| 数据库操作 (DB) | ~0% | >85% | 高 |
| API路由 | ~0% | >80% | 高 |
| UI组件 | ~10% | >75% | 中 |
| 集成测试 | ~0% | >60% | 中 |
| E2E测试 | ~0% | >50% | 低 |

## 测试文件结构规划

```
src/__tests__/
├── unit/
│   ├── lib/
│   │   ├── db.test.ts           # 数据库工具测试
│   │   ├── error-handler.test.ts # 错误处理测试
│   │   ├── audio-processor.test.ts
│   │   └── word-timestamp.test.ts
│   ├── utils/
│   │   └── file-utils.test.ts
│   └── types/
│       └── validation.test.ts
├── api/
│   ├── transcribe.test.ts
│   ├── postprocess.test.ts
│   └── progress.test.ts
├── components/
│   ├── file-upload.test.tsx
│   ├── file-list.test.tsx
│   ├── audio-player.test.tsx
│   └── subtitle-display.test.tsx
├── integration/
│   ├── file-processing.test.ts
│   └── audio-transcription.test.ts
└── e2e/
    ├── basic-workflow.test.ts
    └── error-handling.test.ts
```

## 单元测试实施计划

### 阶段 1: 核心工具函数测试（2天）

#### 任务 1.1: 数据库工具测试 (`/src/__tests__/unit/lib/db.test.ts`)

```typescript
import { DBUtils } from '@/lib/db';
import { db } from '@/lib/db';
import { fakeIndexedDB } from 'fake-indexeddb';

describe('DBUtils', () => {
  beforeEach(async () => {
    // 使用 fake-indexeddb 进行测试
    // 初始化测试数据
  });

  describe('File operations', () => {
    it('should add a new file', async () => {
      const fileId = await DBUtils.addFile({
        name: 'test.mp3',
        size: 1024,
        type: 'audio/mpeg',
        blob: new Blob()
      });

      expect(fileId).toBeGreaterThan(0);

      const file = await DBUtils.getFile(fileId);
      expect(file?.name).toBe('test.mp3');
    });

    it('should throw error when file not found', async () => {
      await expect(DBUtils.getFile(999)).rejects.toThrow('File not found');
    });

    // 更多测试用例...
  });

  describe('Transcript operations', () => {
    // 转录相关操作测试
  });

  describe('Segment operations', () => {
    // 片段相关操作测试
  });
});
```

#### 任务 1.2: 错误处理测试 (`/src/__tests__/unit/lib/error-handler.test.ts`)

```typescript
import { ErrorHandler, ErrorCodes } from '@/lib/error-handler';

describe('ErrorHandler', () => {
  it('should create standardized error objects', () => {
    const error = ErrorHandler.createError(
      'DB_RECORD_NOT_FOUND',
      'Record not found',
      { id: 123 },
      404
    );

    expect(error.code).toBe(ErrorCodes.dbRecordNotFound);
    expect(error.statusCode).toBe(404);
  });

  it('should handle unknown error types', () => {
    const unknownError = { custom: 'error' };
    const handledError = ErrorHandler.handleError(unknownError, 'test');

    expect(handledError.code).toBe(ErrorCodes.internalServerError);
  });
});
```

### 阶段 2: API路由测试（2天）

#### 任务 2.1: 转录API测试 (`/src/__tests__/api/transcribe.test.ts`)

```typescript
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/transcribe/route';
import { db } from '@/lib/db';

describe('POST /api/transcribe', () => {
  beforeEach(async () => {
    // 设置测试数据库
    await db.files.add({
      name: 'test.mp3',
      size: 1024,
      type: 'audio/mpeg',
      blob: new Blob(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  it('should return 400 for invalid request', async () => {
    const request = new NextRequest('http://localhost/api/transcribe', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should return 404 for non-existent file', async () => {
    const request = new NextRequest('http://localhost/api/transcribe', {
      method: 'POST',
      body: JSON.stringify({ fileId: 999 })
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
  });

  // 更多测试用例...
});
```

#### 任务 2.2: 后处理API测试 (`/src/__tests__/api/postprocess.test.ts`)

```typescript
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/postprocess/route';

describe('POST /api/postprocess', () => {
  it('should validate request parameters', async () => {
    const request = new NextRequest('http://localhost/api/postprocess', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  // 更多测试用例...
});
```

### 阶段 3: UI组件测试（2天）

#### 任务 3.1: 文件上传组件测试 (`/src/__tests__/components/file-upload.test.tsx`)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUpload from '@/components/file-upload';

describe('FileUpload', () => {
  it('should render upload button', () => {
    render(<FileUpload onUpload={jest.fn()} />);
    expect(screen.getByText('Upload Audio File')).toBeInTheDocument();
  });

  it('should accept audio files', () => {
    render(<FileUpload onUpload={jest.fn()} />);
    const input = screen.getByLabelText('Upload audio file');

    expect(input).toHaveAttribute('accept', 'audio/*');
  });

  it('should call onUpload with selected file', async () => {
    const mockOnUpload = jest.fn();
    render(<FileUpload onUpload={mockOnUpload} />);

    const file = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
    const input = screen.getByLabelText('Upload audio file');

    await userEvent.upload(input, file);

    expect(mockOnUpload).toHaveBeenCalledWith(file);
  });
});
```

#### 任务 3.2: 音频播放器组件测试 (`/src/__tests__/components/audio-player.test.tsx`)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import AudioPlayer from '@/components/audio-player';

describe('AudioPlayer', () => {
  const mockAudio = {
    url: 'blob:test',
    duration: 120,
    currentTime: 0
  };

  it('should render playback controls', () => {
    render(<AudioPlayer audio={mockAudio} />);

    expect(screen.getByLabelText('Play')).toBeInTheDocument();
    expect(screen.getByLabelText('Pause')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('should display current time and duration', () => {
    render(<AudioPlayer audio={mockAudio} />);

    expect(screen.getByText('0:00')).toBeInTheDocument();
    expect(screen.getByText('2:00')).toBeInTheDocument();
  });
});
```

## 集成测试计划

### 文件处理流程测试 (`/src/__tests__/integration/file-processing.test.ts`)

```typescript
describe('File Processing Integration', () => {
  it('should complete full file processing workflow', async () => {
    // 1. 上传文件
    const fileId = await uploadTestFile('test.mp3');

    // 2. 开始转录
    const transcriptId = await startTranscription(fileId);

    // 3. 检查转录状态
    await waitForTranscriptionCompletion(transcriptId);

    // 4. 进行后处理
    const processed = await postProcessTranscript(transcriptId);

    // 5. 验证结果
    expect(processed.segments).toHaveLength(1);
    expect(processed.status).toBe('completed');
  });

  it('should handle processing errors gracefully', async () => {
    // 测试错误处理流程
  });
});
```

## E2E测试计划

### 基本工作流测试 (`/src/__tests__/e2e/basic-workflow.test.ts`)

```typescript
describe('Basic Workflow E2E', () => {
  it('should allow user to upload and process audio file', async () => {
    // 启动应用
    await page.goto('http://localhost:3000');

    // 上传文件
    const fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile('./test-data/sample.mp3');

    // 开始处理
    await page.click('button:has-text("Start Transcription")');

    // 等待处理完成
    await page.waitForSelector('text=Processing completed');

    // 验证结果
    const segments = await page.$$('.segment');
    expect(segments.length).toBeGreaterThan(0);
  });
});
```

## 测试工具和配置

### Jest 配置优化 (`/jest.config.js`)

```javascript
module.exports = {
  // ... 现有配置

  // 添加测试覆盖率的忽略模式
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/src/types/',
    '/src/__tests__/',
  ],

  // 设置测试超时
  testTimeout: 30000,

  // 添加测试环境变量
  setupFiles: ['<rootDir>/jest.env.js'],
};
```

### 测试环境变量 (`/jest.env.js`)

```javascript
// 测试环境变量
process.env.TEST_MODE = 'true';
process.env.GROQ_API_KEY = 'test-key';
process.env.OPENROUTER_API_KEY = 'test-key';
```

### 测试工具函数 (`/src/__tests__/utils/test-utils.ts`)

```typescript
export const createTestFile = (name: string, type: string = 'audio/mpeg'): File => {
  return new File(['test content'], name, { type });
};

export const mockIndexedDB = () => {
  // 设置 fake-indexeddb
};

export const waitForCondition = async (condition: () => boolean, timeout = 5000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (condition()) return true;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Condition not met within timeout');
};
```

## 测试执行策略

### 本地开发
```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- src/__tests__/unit/lib/db.test.ts

# 监视模式
npm run test:watch

# 覆盖率报告
npm run test:coverage
```

### CI/CD 流水线
```yaml
# GitHub Actions 示例
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'

    - run: npm ci
    - run: npm run test:coverage
    - run: npm run build
```

### 测试报告

- **控制台输出**: 详细的测试结果和错误信息
- **覆盖率报告**: HTML格式的覆盖率报告
- **测试趋势**: 历史测试结果跟踪
- **失败分析**: 自动化的失败测试分析

## 质量门禁

### 提交前检查
```bash
# pre-commit hook
npm run test
npm run lint
npm run type-check
```

### PR合并要求
- ✅ 所有测试通过
- ✅ 测试覆盖率不低于目标
- ✅ 无lint错误
- ✅ 无类型错误
- ✅ 代码审查通过

## 实施时间表

| 阶段 | 任务 | 预计时间 | 状态 |
|------|------|----------|------|
| 阶段1 | 核心工具函数测试 | 2天 | 待开始 |
| 阶段2 | API路由测试 | 2天 | 待开始 |
| 阶段3 | UI组件测试 | 2天 | 待开始 |
| 阶段4 | 集成测试 | 1天 | 待开始 |
| 阶段5 | E2E测试 | 1天 | 待开始 |
| **总计** | | **8天** | |

通过这个全面的测试策略，可以确保应用的可靠性和质量，同时为持续集成和部署提供坚实的基础。