# 项目目录结构说明

## 整体结构

```
shadowing-learning/
├── app/                    # Next.js App Router
│   ├── api/               # API路由
│   │   ├── transcribe/    # 转录API
│   │   │   └── route.ts
│   │   ├── postprocess/   # 后处理API
│   │   │   └── route.ts
│   │   └── health/        # 健康检查
│   │       └── route.ts
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   └── files/
│       ├── [id]/          # 文件详情页
│       │   └── page.tsx
│       └── page.tsx       # 文件列表页
├── components/            # 可复用组件
│   ├── ui/               # shadcn/ui组件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── audio/
│   │   ├── AudioPlayer.tsx
│   │   ├── Waveform.tsx
│   │   └── AudioUploader.tsx
│   ├── transcription/
│   │   ├── SubtitleView.tsx
│   │   ├── SubtitleLine.tsx
│   │   └── LoopController.tsx
│   └── common/
│       ├── ErrorBoundary.tsx
│       ├── LoadingSpinner.tsx
│       └── Toast.tsx
├── lib/                   # 工具库和工具函数
│   ├── db/               # 数据库相关
│   │   ├── index.ts      # Dexie配置
│   │   ├── types.ts      # 类型定义
│   │   └── utils.ts      # 数据库工具
│   ├── audio/            # 音频处理
│   │   ├── processor.ts
│   │   ├── slicer.ts
│   │   └── waveform.ts
│   ├── transcription/    # 转录相关
│   │   ├── merger.ts
│   │   ├── synchronizer.ts
│   │   └── validator.ts
│   ├── api/              # API客户端
│   │   ├── client.ts
│   │   ├── transcribe.ts
│   │   └── postprocess.ts
│   └── utils/            # 通用工具
│       ├── constants.ts
│       ├── helpers.ts
│       └── types.ts
├── hooks/                 # 自定义React Hooks
│   ├── useAudio.ts
│   ├── useTranscription.ts
│   ├── useLoop.ts
│   └── useDatabase.ts
├── types/                 # TypeScript类型定义
│   ├── index.ts
│   ├── audio.ts
│   ├── transcription.ts
│   └── database.ts
├── workers/               # Web Workers
│   ├── audio-processor.js
│   └── transcription-merger.js
├── public/                # 静态资源
│   ├── fonts/
│   ├── icons/
│   └── workers/
├── docs/                  # 文档
│   ├── ARCHITECTURE.md
│   ├── PROJECT_STRUCTURE.md
│   └── API_REFERENCE.md
├── tests/                 # 测试文件
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/               # 构建和部署脚本
├── .env.example          # 环境变量示例
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## 关键文件说明

### 1. 数据库层 (`lib/db/`)

- `index.ts`: Dexie数据库配置和实例化
- `types.ts`: IndexedDB表结构和类型定义
- `utils.ts`: 数据库操作工具函数

### 2. 音频处理层 (`lib/audio/`)

- `processor.ts`: 音频编解码和格式转换
- `slicer.ts`: 音频分片算法实现
- `waveform.ts`: 波形数据生成和渲染

### 3. 转录处理层 (`lib/transcription/`)

- `merger.ts`: 分片转录结果合并算法
- `synchronizer.ts`: 字幕同步引擎
- `validator.ts`: 数据验证和清理

### 4. API层 (`lib/api/`)

- `client.ts`: 统一的API客户端配置
- `transcribe.ts`: 转录API封装
- `postprocess.ts`: 后处理API封装

### 5. 核心组件 (`components/`)

- `AudioPlayer.tsx`: 音频播放器组件
- `SubtitleView.tsx`: 字幕显示组件
- `LoopController.tsx`: 跟读循环控制
- `AudioUploader.tsx`: 文件上传组件

### 6. 自定义Hooks (`hooks/`)

- `useAudio.ts`: 音频播放状态管理
- `useTranscription.ts`: 转录数据处理
- `useLoop.ts`: 跟读循环逻辑
- `useDatabase.ts`: 数据库操作封装

## 开发工作流

### 新增功能流程
1. 在`types/`中定义相关类型
2. 在`lib/`中实现核心逻辑
3. 在`hooks/`中创建状态管理
4. 在`components/`中实现UI组件
5. 在`tests/`中编写测试用例

### 代码组织原则
- **单一职责**: 每个文件/函数只做一件事
- **依赖倒置**: 高层模块不依赖低层模块细节
- **接口隔离**: 使用明确的接口定义
- **开闭原则**: 对扩展开放，对修改关闭

## 构建和部署

项目使用标准的Next.js构建流程，支持多种部署方式：

1. **Vercel部署**: 零配置部署
2. **Docker部署**: 容器化部署
3. **静态导出**: 生成静态文件

所有构建配置都在`next.config.js`和相关配置文件中定义。
