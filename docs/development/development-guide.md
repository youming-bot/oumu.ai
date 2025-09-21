# 开发指南

## 📋 开发概览

本指南提供了参与 oumu.ai 项目开发所需的所有信息，包括环境设置、编码标准、测试策略和贡献流程。

### 开发环境

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **IDE**: VS Code (推荐)
- **浏览器**: Chrome/Firefox 最新版本

---

## 🛠️ 环境设置

### 1. 克隆项目

```bash
git clone https://github.com/your-username/shadowing-learning.git
cd shadowing-learning
```

### 2. 安装依赖

```bash
# 安装 pnpm (如果尚未安装)
npm install -g pnpm

# 安装项目依赖
pnpm install
```

### 3. 环境配置

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑环境变量
nano .env.local
```

### 4. 启动开发服务器

```bash
# 启动开发服务器
pnpm dev

# 在另一个终端启动测试
pnpm test --watch
```

### 5. 验证设置

```bash
# 运行类型检查
pnpm run type-check

# 运行代码质量检查
pnpm run lint

# 运行测试
pnpm test

# 构建项目
pnpm run build
```

---

## 🎯 项目结构

```
shadowing-learning/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   ├── layout.tsx         # 根布局
│   │   └── page.tsx           # 主页面
│   ├── components/            # React 组件
│   │   ├── ui/               # shadcn/ui 组件
│   │   ├── audio-player.tsx  # 音频播放器
│   │   ├── file-upload.tsx   # 文件上传
│   │   └── ...
│   ├── hooks/                # 自定义 Hooks
│   │   ├── useAppState.ts    # 应用状态
│   │   ├── useAudioPlayer.ts # 音频播放
│   │   └── ...
│   ├── lib/                  # 工具库
│   │   ├── db.ts            # 数据库
│   │   ├── audio-processor.ts # 音频处理
│   │   └── ...
│   └── types/               # TypeScript 类型
│       ├── database.ts      # 数据库类型
│       └── errors.ts        # 错误类型
├── test/                     # 测试文件
│   ├── unit/                # 单元测试
│   ├── integration/         # 集成测试
│   └── diagnostic/          # 诊断测试
├── docs/                     # 文档
├── scripts/                  # 脚本
└── config/                  # 配置文件
```

---

## 📝 编码标准

### TypeScript 规范

#### 1. 类型定义

```typescript
// ✅ 良好
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

interface UserCreationParams {
  name: string;
  email: string;
}

// ❌ 避免
interface User {
  id: any;
  name: string;
  email: string;
  createdAt: any;
}
```

#### 2. 函数签名

```typescript
// ✅ 良好
interface AudioProcessorOptions {
  chunkSize?: number;
  overlap?: number;
  onProgress?: (progress: number) => void;
}

async function processAudio(
  audioBuffer: ArrayBuffer,
  options: AudioProcessorOptions = {}
): Promise<ProcessedAudio> {
  const { chunkSize = 45, overlap = 0.2, onProgress } = options;
  // 实现
}

// ❌ 避免
async function processAudio(audioBuffer, options) {
  // 实现
}
```

#### 3. 错误处理

```typescript
// ✅ 良好
class TranscriptionError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'TranscriptionError';
  }
}

try {
  const result = await transcribeAudio(audioData);
  return result;
} catch (error) {
  if (error instanceof TranscriptionError) {
    logger.error('Transcription failed', { code: error.code, details: error.details });
    throw new ApplicationError(`Transcription failed: ${error.message}`, error.code);
  }
  throw error;
}
```

### React 组件规范

#### 1. 组件定义

```typescript
// ✅ 良好
interface AudioPlayerProps {
  audioUrl: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  playbackRate: number;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onSeek,
  playbackRate,
}) => {
  // 实现
};

export default AudioPlayer;
```

#### 2. Hooks 使用

```typescript
// ✅ 良好
const useAudioPlayer = (audioUrl: string) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const togglePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);
  
  return {
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    audioRef,
  };
};
```

#### 3. 性能优化

```typescript
// ✅ 使用 React.memo 优化渲染
const ExpensiveComponent = React.memo<{ data: LargeData }>(({ data }) => {
  const processedData = useMemo(() => {
    return expensiveOperation(data);
  }, [data]);
  
  return <div>{processedData}</div>;
});

// ✅ 使用 useCallback 避免不必要的重渲染
const ParentComponent: React.FC = () => {
  const [count, setCount] = useState(0);
  
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);
  
  return (
    <div>
      <ChildComponent onClick={handleClick} />
      <p>Count: {count}</p>
    </div>
  );
};
```

### 文件命名约定

```
组件文件: PascalCase (AudioPlayer.tsx)
工具文件: camelCase (audioProcessor.ts)
类型文件: camelCase (database.ts)
测试文件: *.test.ts (audioProcessor.test.ts)
Hook 文件: use*.ts (useAudioPlayer.ts)
```

---

## 🧪 测试策略

### 测试金字塔

```
E2E Tests (5%)
    ↓
Integration Tests (20%)
    ↓
Unit Tests (75%)
```

### 单元测试

#### 1. 工具函数测试

```typescript
// test/unit/lib/audio-processor.test.ts
import { processAudioChunk } from '@/lib/audio-processor';
import { createMockAudioBuffer } from '../utils/audio-mocks';

describe('processAudioChunk', () => {
  it('should process audio chunk correctly', async () => {
    const mockBuffer = createMockAudioBuffer(44100, 2);
    const result = await processAudioChunk(mockBuffer);
    
    expect(result).toEqual({
      duration: expect.any(Number),
      channels: expect.any(Array),
      sampleRate: 44100,
    });
  });
  
  it('should handle empty audio buffer', async () => {
    const emptyBuffer = createMockAudioBuffer(0, 0);
    await expect(processAudioChunk(emptyBuffer)).rejects.toThrow('Empty audio buffer');
  });
});
```

#### 2. Hook 测试

```typescript
// test/unit/hooks/useAudioPlayer.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

describe('useAudioPlayer', () => {
  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useAudioPlayer('test.mp3'));
    
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentTime).toBe(0);
    expect(result.current.duration).toBe(0);
  });
  
  it('should toggle play/pause state', () => {
    const { result } = renderHook(() => useAudioPlayer('test.mp3'));
    
    act(() => {
      result.current.togglePlayPause();
    });
    
    expect(result.current.isPlaying).toBe(true);
    
    act(() => {
      result.current.togglePlayPause();
    });
    
    expect(result.current.isPlaying).toBe(false);
  });
});
```

### 集成测试

```typescript
// test/integration/audio-workflow.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AudioWorkflow } from '@/components/AudioWorkflow';

describe('Audio Workflow Integration', () => {
  it('should handle complete audio processing workflow', async () => {
    render(<AudioWorkflow />);
    
    // 模拟文件上传
    const fileInput = screen.getByLabelText('Upload audio file');
    const mockFile = new File(['mock audio'], 'test.mp3', { type: 'audio/mpeg' });
    
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    
    // 验证处理状态
    await waitFor(() => {
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
    
    // 验证完成状态
    await waitFor(() => {
      expect(screen.getByText('Processing complete')).toBeInTheDocument();
    });
  });
});
```

### 测试配置

```typescript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

---

## 🔄 Git 工作流

### 分支策略

```
main (保护分支)
├── develop (开发分支)
├── feature/add-transcription-support
├── bugfix/fix-audio-sync
└── hotfix/security-patch
```

### 提交消息规范

```bash
# 格式: <类型>(<范围>): <描述>
# 
# 类型:
#   feat: 新功能
#   fix: 修复
#   docs: 文档
#   style: 格式化
#   refactor: 重构
#   test: 测试
#   chore: 构建/工具

# 示例:
feat(audio): add volume control to audio player
fix(subtitle): resolve timing sync issues
docs(api): update API documentation
style(component): format code with biome
```

### Pull Request 流程

1. 创建功能分支
   ```bash
   git checkout -b feature/new-feature main
   ```

2. 开发和提交
   ```bash
   git add .
   git commit -m "feat(component): add new feature"
   git push origin feature/new-feature
   ```

3. 创建 PR 并自检
   ```bash
   # 运行所有检查
   pnpm run type-check
   pnpm run lint
   pnpm test
   pnpm run build
   ```

4. 代码审查
   - 至少需要一个审查者
   - 所有检查必须通过
   - 测试覆盖率必须 >= 80%

5. 合并到 main
   ```bash
   git checkout main
   git pull origin main
   git merge --no-ff feature/new-feature
   git push origin main
   ```

---

## 🔧 开发工具

### VS Code 配置

#### 推荐扩展

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "biomejs.biome",
    "ms-playwright.playwright",
    "eamodio.gitlens"
  ]
}
```

#### 工作区设置

```json
// .vscode/settings.json
{
  "typescript.preferences.preferTypeOnlyAutoImports": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.biome": true
  },
  "editor.defaultFormatter": "biomejs.biome",
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true
  }
}
```

### 开发脚本

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "clean": "rm -rf .next dist",
    "format": "biome format --write ."
  }
}
```

### Pre-commit 钩子

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "biome check --write",
      "biome check"
    ],
    "*.{js,jsx}": [
      "biome check --write",
      "biome check"
    ],
    "*.{json,md}": [
      "biome check --write",
      "biome check"
    ]
  }
}
```

---

## 🐛 调试技巧

### 1. 浏览器开发者工具

```typescript
// 添加调试标记
console.log('🔍 Audio processing started', { duration, sampleRate });

// 使用 performance.mark() 测量性能
performance.mark('process-start');
// ... 处理逻辑
performance.mark('process-end');
performance.measure('process-duration', 'process-start', 'process-end');
```

### 2. React DevTools

```typescript
// 使用 React DevTools Profiler
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* 渲染逻辑 */}</div>;
});
```

### 3. 网络调试

```typescript
// 拦截和记录 API 调用
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  console.log('📡 API Call:', args[0]);
  const start = performance.now();
  
  try {
    const response = await originalFetch(...args);
    const end = performance.now();
    console.log(`✅ API Response: ${args[0]} (${end - start}ms)`);
    return response;
  } catch (error) {
    console.error(`❌ API Error: ${args[0]}`, error);
    throw error;
  }
};
```

---

## 📚 资源和链接

### 官方文档

- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://react.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [shadcn/ui 文档](https://ui.shadcn.com/)
- [Biome.js 文档](https://biomejs.dev/docs/)

### 学习资源

- [React 最佳实践](https://react.dev/learn)
- [TypeScript 深入学习](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [Next.js 性能优化](https://nextjs.org/docs/app/building-your-application/optimizing)
- [现代 JavaScript 测试](https://jestjs.io/docs/getting-started)

### 社区

- [GitHub Discussions](https://github.com/your-username/shadowing-learning/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/shadowing-learning)
- [Discord 服务器](https://discord.gg/shadowing-learning)

---

*开发指南 | 版本: 1.0 | 最后更新: 2024年9月22日*