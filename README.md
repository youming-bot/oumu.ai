# 影子学习应用 (Shadowing Learning)

基于Web的语言"影子跟读"学习应用，支持音频转录、文本处理和交互式播放功能。

## 📊 项目状态

### 🚀 实现完成度: 85-90%

#### ✅ 已完成核心功能

- **核心架构**: Next.js 15 + React 19 + TypeScript + shadcn/ui
- **数据库层**: Dexie (IndexedDB) 完整实现，支持迁移
- **API 路由**: `/api/transcribe` (Groq), `/api/postprocess` (OpenRouter), `/api/progress`
- **UI 组件**: 基于 shadcn/ui 的音频播放器、字幕显示、文件上传组件
- **错误处理**: 统一的错误处理框架
- **构建系统**: 能够成功构建，无致命错误
- **数据处理**: 分片音频处理、并发控制、流式转发
- **字幕同步**: 毫秒级精度的字幕同步和 A-B 循环功能
- **术语管理**: 自定义术语库和统一翻译功能

#### ⚠️ 已知问题

- **TypeScript 警告**: 未使用变量、any 类型需要清理
- **测试失败**: 100个测试失败，主要是 API 相关的问题
- **代码清理**: 需要完善类型定义和错误处理

## ✨ 核心特性

- 🎵 **本地音频存储**：所有文件存储在浏览器IndexedDB中，保护隐私
- 🗣️ **智能语音转录**：集成Groq Whisper-large-v3进行高质量转录
- 🔄 **文本智能处理**：OpenRouter LLM进行分句规范化、翻译和标注
- ⏯️ **高级播放控制**：支持A-B循环、变速播放、精确定位
- 📝 **实时字幕同步**：毫秒级字幕同步和高亮显示
- 🎯 **跟读练习模式**：点击句子自动循环播放，专为语言学习设计
- 📊 **进度跟踪**：实时转录和后处理进度监控
- 🏷️ **术语管理**：自定义术语库，支持统一翻译和标注

## 🛠️ 技术架构

### 前端技术栈

- **框架**: Next.js 15 (App Router) + React 19
- **语言**: TypeScript 5.9.2 (严格模式)
- **UI组件**: shadcn/ui + Radix UI + Tailwind CSS 4.1.13
- **图标**: Lucide React 0.543.0
- **数据库**: Dexie 4.2.0 (IndexedDB封装)
- **状态管理**: React内置 + IndexedDB持久化
- **主题**: next-themes 0.4.6 (深色/浅色模式)
- **通知**: Sonner 2.0.7 (Toast通知)

### 后端集成

- **语音转录**: Groq Whisper-large-v3
- **文本处理**: OpenRouter (支持多种LLM模型)
- **数据验证**: Zod 4.1.7 schema验证
- **安全**: DOMPurify 3.2.6 (XSS防护)

### 开发工具

- **代码质量**: Biome.js 2.2.4 (替代 ESLint + Prettier)
- **测试**: Jest 30.1.3 + Testing Library
- **类型检查**: TypeScript 5.9.2
- **构建**: Next.js 15.5.3

### 数据流架构

```
用户上传音频 → IndexedDB存储 → 分片处理 → Groq转录 → OpenRouter后处理 → 字幕同步播放
     ↓              ↓           ↓          ↓            ↓              ↓
  文件管理      本地持久化     并发控制    语音识别    智能标注        跟读练习
```

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 pnpm
- 现代浏览器（支持IndexedDB和Web Audio API）

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd shadowing-learning
```

2. **安装依赖**

```bash
npm install
# 或使用 pnpm（推荐）
pnpm install
```

3. **配置环境变量**

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，添加必要的API密钥：

```env
# Groq API 配置
GROQ_API_KEY=your_groq_api_key

# OpenRouter API 配置
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=deepseek/deepseek-chat-v3.1:free

# 音频处理配置
MAX_CONCURRENCY=3
CHUNK_SECONDS=45
CHUNK_OVERLAP=0.2
```

4. **启动开发服务器**

```bash
npm run dev
# 或
pnpm dev
```

5. **访问应用**
   打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 📖 使用指南

### 基本流程

1. **上传音频**：拖拽或选择音频文件到上传区域
2. **等待处理**：系统自动进行语音转录和文本处理
3. **开始学习**：使用播放器和字幕进行影子跟读练习

### 高级功能

- **A-B循环**：点击任意句子开启循环播放
- **变速播放**：调整播放速度（0.5x - 2.0x）
- **精确定位**：点击进度条快速跳转
- **术语管理**：自定义术语库进行统一翻译
- **进度监控**：实时查看转录和后处理进度

## 🧩 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API路由
│   │   ├── transcribe/    # 语音转录API
│   │   ├── postprocess/   # 文本后处理API
│   │   └── progress/      # 进度查询API
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 主页面
│   └── page-original.tsx  # 原始页面备份
├── components/            # UI组件
│   ├── ui/               # shadcn/ui基础组件
│   ├── audio-player.tsx   # 音频播放器
│   ├── file-upload.tsx    # 文件上传
│   ├── file-list.tsx      # 文件列表
│   ├── subtitle-display.tsx # 字幕显示
│   ├── waveform-display.tsx # 波形显示
│   ├── terminology-glossary.tsx # 术语管理
│   ├── subtitle-renderer.tsx # 字幕渲染器
│   ├── word-with-timing.tsx # 单词时间戳
│   └── layout.tsx         # 布局组件
├── hooks/                 # React Hooks
│   ├── useAppState.ts     # 应用状态管理
│   ├── useAudioPlayer.ts  # 音频播放器
│   ├── useFiles.ts        # 文件管理
│   ├── useMemoryCleanup.ts # 内存清理
│   ├── useTerms.ts        # 术语管理
│   ├── useTranscriptionProgress.ts # 转录进度
│   └── useTranscripts.ts   # 转录管理
├── lib/                   # 核心工具库
│   ├── db.ts             # 数据库配置
│   ├── groq-client.ts    # Groq API客户端
│   ├── openrouter-client.ts # OpenRouter客户端
│   ├── audio-processor.ts # 音频处理
│   ├── subtitle-sync.ts   # 字幕同步
│   ├── error-handler.ts   # 错误处理
│   ├── migration-utils.ts # 数据库迁移
│   ├── word-timestamp-service.ts # 单词时间戳服务
│   ├── waveform-generator.ts # 波形生成器
│   ├── url-manager.ts     # URL管理
│   └── utils.ts           # 工具函数
└── types/                 # TypeScript类型定义
    ├── database.ts        # 数据库类型
    └── errors.ts          # 错误类型
```

## 🔧 开发命令

### 开发环境

```bash
npm run dev          # 启动开发服务器
npm run type-check   # TypeScript类型检查
npm run lint         # Biome.js代码质量检查
npm run format       # 代码格式化
npm run check        # 全面检查(lint + format)
```

### 构建和部署

```bash
npm run build        # 生产环境构建
npm run start        # 启动生产服务器
```

### 测试

```bash
npm test            # 运行单元测试
npm run test:watch  # 监视模式运行测试
npm run test:coverage # 测试覆盖率报告
```

### 迁移脚本（一次性）

```bash
./scripts/migrate-to-biome.sh    # 迁移到Biome.js
./scripts/verify-biome-migration.sh # 验证迁移结果
./scripts/run-tests.sh           # 运行测试脚本
```

## 🎯 核心功能实现

### 音频处理流程

1. **文件上传** → 验证格式和大小
2. **分片处理** → 45秒分片，0.2秒重叠
3. **并发转录** → 最多3个并发请求
4. **结果合并** → 智能去重和拼接
5. **后处理** → LLM规范化和标注

### 字幕同步机制

- **二分查找算法**：O(log n)时间复杂度定位当前句子
- **亚秒级精度**：50ms容差范围内的精确同步
- **平滑滚动**：200ms节流的自动滚动跟随

### 跟读循环控制

- **智能循环**：自动检测音频边界
- **可配置次数**：支持设定循环次数
- **无缝切换**：循环结束后可选择继续播放

### 数据模型

```typescript
interface FileRow {
  id: number;
  name: string;
  size: number;
  type: string;
  blob: Blob;
  uploadedAt: Date;
  duration?: number;
  transcriptionStatus: "pending" | "processing" | "completed" | "error";
}

interface TranscriptRow {
  id: number;
  fileId: number;
  rawText: string;
  segments: Segment[];
  processingStatus: "pending" | "processing" | "completed" | "error";
  createdAt: Date;
  updatedAt: Date;
}

interface Segment {
  id: number;
  transcriptId: number;
  start: number;
  end: number;
  text: string;
  normalizedText?: string;
  translation?: string;
  annotations?: string;
  furigana?: string;
  wordTimestamps: WordTimestamp[];
}
```

## 🔒 隐私和安全

### 数据隐私

- **本地存储优先**：所有用户数据存储在浏览器IndexedDB
- **临时传输**：音频文件仅在转录时临时传输，不在服务器持久化
- **用户控制**：提供一键清空所有本地数据功能

### 安全措施

- **API密钥保护**：敏感信息仅在服务端处理
- **输入验证**：Zod schema严格验证所有输入
- **HTTPS强制**：所有API通信使用加密传输
- **XSS防护**：使用DOMPurify进行输入清理
- **无用户追踪**：不收集任何个人身份信息

## 📚 API文档

### 转录API

```typescript
POST /api/transcribe
Content-Type: multipart/form-data

// 请求体
FormData {
  audio: Blob,           // 音频文件
  meta: string,          // JSON字符串
}

// Query参数
?fileId=string&chunkIndex=number&offsetSec=number

// 响应
{
  ok: boolean,
  chunkIndex: number,
  data: {
    text: string,
    segments: Segment[]
  }
}
```

### 后处理API

```typescript
POST /api/postprocess
Content-Type: application/json

// 请求体
{
  fileId: string,
  segments: RawSegment[],
  targetLanguage?: string,    // default: 'zh'
  enableAnnotations?: boolean,// default: true
  enableFurigana?: boolean,   // default: true
  enableTerminology?: boolean // default: true
}

// 响应
{
  ok: boolean,
  data: {
    lang: string,
    segments: ProcessedSegment[]
  }
}
```

### 进度查询API

```typescript
GET /api/progress/[fileId]

// 响应
{
  progress: number,      // 0-100
  status: string,        // 'pending' | 'processing' | 'completed' | 'error'
  error?: string,        // 错误信息
  currentStep?: string   // 当前步骤
}
```

## 🐛 故障排除

### 常见问题

**音频无法播放**

- 检查浏览器是否支持该音频格式
- 确认文件未损坏
- 尝试刷新页面

**转录失败**

- 检查网络连接
- 验证API密钥配置
- 确认音频质量清晰
- 检查GROQ_API_KEY和OPENROUTER_API_KEY是否正确

**字幕不同步**

- 检查音频文件完整性
- 尝试重新处理
- 报告问题到项目仓库

### 当前已知问题

#### TypeScript 错误

```typescript
// 文件: src/components/file-list.tsx
// 错误: 参数类型 'number | undefined' 不能赋值给 'number'
// 解决: 需要添加空值检查或默认值

// 文件: src/lib/transcription-service.ts
// 错误: 'unknown' 类型不能赋值给 'string | undefined'
// 解决: 需要完善类型定义和类型断言
```

#### 测试失败

- **TranscriptionService测试**: `clearProgress` 方法不存在
- **GroqClient测试**: 网络错误处理超时
- **JSDOM环境问题**: FormData操作在某些测试中失败

#### 构建问题

- TypeScript 严格模式下的类型兼容性问题
- 部分组件的Props类型定义不完整

### 日志查看

打开浏览器开发者工具 → Console 标签查看详细错误信息

## 🤝 贡献指南

### 开发环境设置

1. Fork项目仓库
2. 创建功能分支：`git checkout -b feature/your-feature`
3. 安装依赖：`npm install`
4. 配置环境变量
5. 开始开发：`npm run dev`

### 提交规范

遵循 [Conventional Commits](https://conventionalcommits.org/) 规范：

```
feat: 新功能
fix: 错误修复
docs: 文档更新
style: 代码格式
refactor: 代码重构
test: 测试相关
chore: 其他更改
```

### 代码质量要求

- 所有代码必须通过 TypeScript 类型检查
- 遵循 Biome.js 代码规范
- 编写适当的单元测试
- 更新相关文档

### Pull Request

- 提供清晰的描述
- 包含相关的issue链接
- 确保所有测试通过
- 更新相关文档

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

## 🙏 致谢

- [Groq](https://groq.com/) - 提供高质量语音转录服务
- [OpenRouter](https://openrouter.ai/) - 提供多样化LLM模型支持
- [shadcn/ui](https://ui.shadcn.com/) - 优雅的UI组件库
- [Dexie.js](https://dexie.org/) - 强大的IndexedDB封装库
- [Next.js](https://nextjs.org/) - React框架
- [TypeScript](https://www.typescriptlang.org/) - 类型安全
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的CSS框架

---

**开始你的语言学习之旅！** 🚀

_最后更新: 2024年9月18日_
