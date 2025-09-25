# 开发指南

本文档为开发者提供 Oumu.ai 项目的完整开发指南，包括环境设置、开发流程、代码规范和最佳实践。

## 概览

Oumu.ai 使用现代化的技术栈，采用本地优先的架构设计，为开发者提供良好的开发体验。

### 技术栈

- **前端框架**: Next.js 15 + React 19 + TypeScript
- **UI 组件**: shadcn/ui + Radix UI + Tailwind CSS
- **数据存储**: IndexedDB (Dexie)
- **AI 服务**: Groq Whisper API + OpenRouter
- **开发工具**: Biome.js + Jest

### 开发理念

- **本地优先**: 所有数据存储在用户本地
- **隐私保护**: 不收集用户敏感信息
- **渐进式增强**: 支持离线使用
- **类型安全**: 完整的 TypeScript 类型覆盖
- **测试驱动**: 全面的测试覆盖

## 快速开始

### 系统要求

- **Node.js**: 18.0 或更高版本
- **pnpm**: 8.0 或更高版本（推荐）
- **浏览器**: Chrome 90+、Firefox 88+、Safari 14+
- **IDE**: VSCode（推荐）

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/yourusername/oumu.ai.git
cd oumu.ai
```

2. **安装依赖**
```bash
pnpm install
```

3. **配置环境变量**
```bash
cp .env.example .env.local
```

4. **配置 API 密钥**
```env
# .env.local
GROQ_API_KEY=your_groq_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=deepseek/deepseek-chat-v3.1:free
```

### 开发环境

#### 启动开发服务器
```bash
pnpm dev
```

访问 http://localhost:3000 查看应用。

#### 运行测试
```bash
# 运行所有测试
pnpm test

# 运行测试监听模式
pnpm test:watch

# 生成测试覆盖率报告
pnpm test:coverage
```

#### 代码质量检查
```bash
# TypeScript 类型检查
pnpm type-check

# 代码格式化和检查
pnpm lint
pnpm format
pnpm check
```

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── transcribe/    # 音频转录 API
│   │   ├── postprocess/   # 文本后处理 API
│   │   └── progress/      # 进度查询 API
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 主页面
│   └── globals.css        # 全局样式
├── components/            # React 组件
│   ├── ui/               # shadcn/ui 基础组件
│   ├── audio-player.tsx   # 音频播放器
│   ├── file-upload.tsx    # 文件上传
│   ├── file-list.tsx      # 文件列表
│   └── subtitle-display.tsx # 字幕显示
├── hooks/                 # 自定义 React Hooks
│   ├── useAppState.ts     # 全局状态管理
│   ├── useAudioPlayer.ts  # 音频播放控制
│   ├── useFiles.ts        # 文件管理
│   └── useTranscripts.ts   # 转录管理
├── lib/                   # 工具库
│   ├── db.ts             # 数据库配置
│   ├── groq-client.ts    # Groq API 客户端
│   ├── openrouter-client.ts # OpenRouter 客户端
│   ├── audio-processor.ts # 音频处理
│   └── utils.ts          # 工具函数
├── types/                 # TypeScript 类型定义
│   ├── database.ts       # 数据库类型
│   └── errors.ts         # 错误类型
└── test/                  # 测试文件
    ├── unit/             # 单元测试
    ├── integration/      # 集成测试
    └── diagnostic/       # 诊断测试
```

## 开发工作流

### 1. 功能开发流程

```bash
# 1. 创建功能分支
git checkout -b feature/your-feature-name

# 2. 开发功能
# 编写代码

# 3. 运行测试
pnpm test

# 4. 代码质量检查
pnpm type-check && pnpm lint

# 5. 提交代码
git commit -m "feat: add new feature"

# 6. 推送到远程
git push origin feature/your-feature-name

# 7. 创建 Pull Request
```

### 2. 代码规范

#### TypeScript 规范

```typescript
// 好的实践
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

const createUser = (user: Omit<User, 'id' | 'createdAt'>): User => {
  return {
    id: generateId(),
    createdAt: new Date(),
    ...user
  };
};

// 避免使用 any
function processData(data: unknown): Result {
  // 使用类型守卫
  if (isValidData(data)) {
    return transformData(data);
  }

  throw new Error('Invalid data format');
}
```

#### React 组件规范

```typescript
// 使用函数组件和 TypeScript
interface AudioPlayerProps {
  src: string;
  onTimeUpdate?: (currentTime: number) => void;
  className?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  onTimeUpdate,
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className={`audio-player ${className}`}>
      {/* 组件内容 */}
    </div>
  );
};

export default AudioPlayer;
```

### 3. 测试规范

#### 单元测试

```typescript
// 组件测试
import { render, screen, fireEvent } from '@testing-library/react';
import { AudioPlayer } from '../AudioPlayer';

describe('AudioPlayer', () => {
  it('renders play button when audio is provided', () => {
    render(<AudioPlayer src="/test.mp3" />);
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('calls onTimeUpdate when time changes', () => {
    const mockOnTimeUpdate = jest.fn();
    render(<AudioPlayer src="/test.mp3" onTimeUpdate={mockOnTimeUpdate} />);

    // 模拟时间更新
    fireEvent.timeUpdate(screen.getByRole('audio'), {
      currentTime: 10
    });

    expect(mockOnTimeUpdate).toHaveBeenCalledWith(10);
  });
});
```

## 组件开发

### UI 组件

项目使用 shadcn/ui 组件库，提供：
- 现代化设计系统
- 可访问性支持
- TypeScript 类型安全
- 主题支持

### 自定义 Hooks

项目包含多个自定义 hooks：
- `useAppState` - 全局应用状态管理
- `useAudioPlayer` - 音频播放控制
- `useFiles` - 文件管理和上传
- `useTranscripts` - 转录数据处理
- `useTranscriptionProgress` - 进度跟踪

### 数据库开发

```typescript
// src/lib/db.ts
import { Dexie, type Table } from 'dexie';

export interface FileRow {
  id?: number;
  name: string;
  size: number;
  type: string;
  blob: Blob;
  uploadedAt: Date;
  duration?: number;
  transcriptionStatus: ProcessingStatus;
}

export class AppDatabase extends Dexie {
  files!: Table<FileRow, number>;
  transcripts!: Table<TranscriptRow, number>;

  constructor() {
    super('OumuDatabase');

    this.version(3).stores({
      files: '++id,name,size,type,uploadedAt,transcriptionStatus',
      transcripts: '++id,fileId,rawText,processingStatus,createdAt,updatedAt'
    });
  }
}

export const db = new AppDatabase();
```

## 部署和发布

### 部署选项

- **Vercel**: 推荐的零配置部署
- **Netlify**: 静态站点托管
- **Docker**: 容器化部署
- **自托管**: 完全控制的服务器部署

### 发布流程

1. 更新版本号
2. 更新 CHANGELOG
3. 创建发布分支
4. 运行完整测试套件
5. 部署到生产环境
6. 创建 GitHub Release

## 贡献指南

### 代码风格

- 使用 Biome.js 进行代码格式化
- 遵循 TypeScript 严格模式
- 使用 ESLint 和 Prettier 规则
- 编写清晰的代码注释

### 提交规范

```bash
# 提交格式
<type>(<scope>): <description>

# 示例
feat: add audio player functionality
fix: resolve subtitle sync issue
docs: update API documentation
style: format code with biome
test: add unit tests for audio player
chore: update dependencies
```

### Pull Request 流程

1. Fork 项目
2. 创建功能分支
3. 编写代码和测试
4. 运行代码质量检查
5. 提交代码
6. 创建 Pull Request
7. 等待代码审查
8. 合并到主分支

### 获取帮助

- **GitHub Issues**: 报告 bug 和请求功能
- **GitHub Discussions**: 技术问题和讨论
- **Stack Overflow**: 使用项目标签提问

### 开发资源

- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://react.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [shadcn/ui 文档](https://ui.shadcn.com/)

---

*最后更新: 2024年9月24日*