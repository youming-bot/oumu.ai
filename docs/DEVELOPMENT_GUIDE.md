# 开发指南

## 项目当前状态

### ✅ 已完成的核心功能

- **完整的项目架构**: Next.js 15 + React 19 + TypeScript + shadcn/ui
- **数据存储**: Dexie (IndexedDB) 完整实现，包含迁移机制
- **API集成**: Groq语音转录和OpenRouter文本处理完整实现
- **用户界面**: 基于shadcn/ui的完整音频学习界面
- **核心算法**: 音频分片、字幕同步、A-B循环等核心功能
- **错误处理**: 统一的错误处理和用户反馈机制
- **构建系统**: 无致命错误，可正常构建和部署

### ⚠️ 需要优化的问题

- **代码质量**: 存在TypeScript警告和未使用变量
- **ESLint配置**: 需要迁移到新的ESLint CLI
- **测试覆盖**: 部分测试需要优化
- **监控系统**: 生产环境监控待完善

## 开发环境设置

### 前置要求
- Node.js 18+
- npm 或 pnpm
- 支持现代Web API的浏览器

### 快速开始

1. **克隆项目并安装依赖**
```bash
git clone <repository-url>
cd shadowing-learning
npm install
```

2. **配置环境变量**
```bash
cp .env.example .env.local
```

编辑 `.env.local`:
```env
GROQ_API_KEY=your_groq_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=deepseek/deepseek-chat-v3.1:free
MAX_CONCURRENCY=3
CHUNK_SECONDS=45
CHUNK_OVERLAP=0.2
```

3. **启动开发服务器**
```bash
npm run dev
```

### 开发命令

```bash
# 开发
npm run dev              # 启动开发服务器
npm run type-check       # TypeScript类型检查
npm run lint             # 代码质量检查

# 构建
npm run build            # 生产环境构建
npm run start            # 启动生产服务器

# 测试
npm test                 # 运行单元测试
npm run test:watch       # 监视模式测试
npm run test:coverage    # 测试覆盖率报告
```

## 项目架构

### 目录结构
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API路由
│   │   ├── transcribe/    # Groq转录API
│   │   ├── postprocess/   # OpenRouter后处理API
│   │   └── progress/      # 进度查询API
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 主页面
├── components/            # UI组件
│   ├── ui/               # shadcn/ui基础组件
│   ├── audio-player.tsx   # 音频播放器
│   ├── file-upload.tsx    # 文件上传
│   ├── file-list.tsx      # 文件列表
│   └── subtitle-display.tsx # 字幕显示
├── lib/                   # 核心工具库
│   ├── db.ts             # 数据库配置
│   ├── groq-client.ts    # Groq API客户端
│   ├── openrouter-client.ts # OpenRouter客户端
│   ├── audio-processor.ts # 音频处理
│   ├── subtitle-sync.ts   # 字幕同步
│   └── error-handler.ts   # 错误处理
└── types/                 # TypeScript类型定义
    ├── database.ts        # 数据库类型
    └── errors.ts          # 错误类型
```

### 核心模块说明

#### 数据库层 (`lib/db.ts`)
- 使用Dexie封装IndexedDB
- 支持数据迁移和版本控制
- 定义FileRow、TranscriptRow、Segment等核心数据模型

#### API层 (`app/api/`)
- **transcribe**: 处理音频分片上传和Groq转录
- **postprocess**: 调用OpenRouter进行文本后处理
- **progress**: 提供实时进度查询

#### 音频处理 (`lib/audio-processor.ts`)
- 音频分片算法（45秒分片，0.2秒重叠）
- 并发控制（最多3个同时请求）
- 音频格式转换和波形生成

#### 字幕同步 (`lib/subtitle-sync.ts`)
- 二分查找算法实现O(log n)时间复杂度
- 实时字幕高亮和滚动跟随
- A-B循环播放控制

## 开发最佳实践

### 代码规范

1. **TypeScript严格模式**
```typescript
// 避免any类型，使用具体类型定义
interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

// 使用Zod进行运行时验证
const schema = z.object({
  fileId: z.string().uuid(),
  segments: z.array(segmentSchema)
});
```

2. **错误处理**
```typescript
// 使用统一的错误处理
import { handleError } from '@/lib/error-handler';

try {
  const result = await riskyOperation();
  return success(result);
} catch (error) {
  return handleError(error);
}
```

3. **组件设计**
```typescript
// 使用shadcn/ui组件
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 遵循组件组合模式
export function FileCard({ file, onPlay }: FileCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{file.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={() => onPlay(file.id)}>
          播放
        </Button>
      </CardContent>
    </Card>
  );
}
```

### 性能优化

1. **音频处理优化**
```typescript
// 使用Web Worker处理音频
const audioProcessor = new Worker('/workers/audio-processor.js');

// 实现音频分片缓存
const audioCache = new Map<string, AudioBuffer>();
```

2. **数据库查询优化**
```typescript
// 使用索引和批量操作
await db.transaction('readwrite', [db.files, db.transcripts], async () => {
  await db.files.bulkPut(files);
  await db.transcripts.bulkPut(transcripts);
});
```

3. **UI性能优化**
```typescript
// 使用防抖和节流
const debouncedSync = useCallback(
  debounce((currentTime: number) => {
    syncSubtitles(currentTime);
  }, 200),
  [syncSubtitles]
);
```

### 测试策略

1. **单元测试**
```typescript
// 测试核心功能
describe('AudioProcessor', () => {
  test('should slice audio correctly', async () => {
    const chunks = await sliceAudio(audioBlob, 45, 0.2);
    expect(chunks).toHaveLength(expectedLength);
  });
});
```

2. **组件测试**
```typescript
// 测试UI组件
import { render, screen, fireEvent } from '@testing-library/react';

test('FileUpload should handle file drop', async () => {
  render(<FileUpload onUpload={mockOnUpload} />);

  const dropzone = screen.getByTestId('dropzone');
  fireEvent.drop(dropzone, { dataTransfer: { files: [testFile] } });

  expect(mockOnUpload).toHaveBeenCalledWith(testFile);
});
```

3. **API测试**
```typescript
// 测试API路由
describe('/api/transcribe', () => {
  test('should return transcription result', async () => {
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.segments).toBeDefined();
  });
});
```

## 调试指南

### 常见问题解决

1. **构建错误**
```bash
# 检查TypeScript错误
npm run type-check

# 检查依赖问题
rm -rf node_modules package-lock.json
npm install
```

2. **运行时错误**
```bash
# 检查浏览器控制台
# 查看Network标签中的API请求
# 检查IndexedDB中的数据状态
```

3. **API问题**
```bash
# 验证环境变量
echo $GROQ_API_KEY
echo $OPENROUTER_API_KEY

# 测试API连接
curl -H "Authorization: Bearer $GROQ_API_KEY" \
     https://api.groq.com/openai/v1/models
```

### 开发工具

1. **浏览器扩展**
- React Developer Tools
- Redux DevTools（如果使用）
- IndexedDB Explorer

2. **VS Code插件**
- TypeScript Importer
- Tailwind CSS IntelliSense
- ESLint
- Prettier

## 部署指南

### Vercel部署（推荐）
```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel

# 配置环境变量
vercel env add GROQ_API_KEY
vercel env add OPENROUTER_API_KEY
```

### Docker部署
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### 环境变量配置
- 在生产环境中设置所有必需的环境变量
- 确保API密钥安全存储
- 配置适当的CORS和安全头

## 贡献指南

### 提交规范
遵循 [Conventional Commits](https://conventionalcommits.org/):
```
feat: 新功能
fix: 错误修复
docs: 文档更新
style: 代码格式
refactor: 代码重构
test: 测试相关
chore: 其他更改
```

### Pull Request流程
1. 创建功能分支
2. 实现功能并添加测试
3. 确保构建通过
4. 提交PR并请求代码审查
5. 根据反馈进行修改
6. 合并到主分支

### 代码审查要点
- 功能是否按预期工作
- 代码质量和可读性
- 测试覆盖是否充分
- 性能影响评估
- 安全性考虑

通过遵循这些指南，可以确保项目的高质量开发和维护。