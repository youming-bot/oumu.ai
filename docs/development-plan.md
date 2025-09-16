# 开发计划 - Shadowing Learning 应用

## 项目概述

这是一个基于网页的语言影子学习应用，提供音频上传、语音转文字、文本处理和交互式播放功能。

## 技术栈

- **框架**: Next.js (App Router)
- **语言**: TypeScript
- **UI**: React + Tailwind CSS + shadcn/ui + Lucide 图标
- **数据库**: Dexie (IndexedDB 封装)
- **API**: Groq (语音转文字), OpenRouter (文本处理)

## 开发阶段规划

### 第一阶段：项目初始化 (第1天)

#### 任务 1: 初始化 Next.js 项目
- 使用 TypeScript 创建 Next.js 项目
- 配置 Tailwind CSS 和 ESLint
- 设置 App Router 结构

#### 任务 2: 安装核心依赖
- Dexie (IndexedDB 封装)
- Zod (数据验证)
- shadcn/ui 组件库
- Lucide 图标

#### 任务 3: 项目结构配置
- 创建标准的 Next.js 项目结构
- 设置 TypeScript 配置
- 配置 Tailwind CSS

#### 任务 4: 环境变量配置
- 创建 `.env.local` 文件
- 配置 Groq API 密钥
- 配置 OpenRouter API 密钥和参数

### 第二阶段：核心基础设施 (第2-3天)

#### 任务 5: 实现数据库层
- 定义 Dexie 数据库模型
- 创建 FileRow、TranscriptRow、Segment 表结构
- 实现数据库工具函数

#### 任务 6: 创建核心类型定义
- TypeScript 接口定义
- 数据库模型类型
- API 请求/响应类型

#### 任务 7: 构建文件上传系统
- 实现文件上传组件
- IndexedDB 文件存储
- 文件元数据管理

#### 任务 8: 音频处理工具
- 音频分块处理算法
- 重叠切片功能
- 音频格式转换

### 第三阶段：API 集成 (第3-4天)

#### 任务 9: Groq API 客户端
- 实现语音转文字客户端
- 错误处理和重试机制
- 请求限流控制

#### 任务 10: 转录 API 路由
- 创建 `/api/transcribe` 路由
- 实现分块处理逻辑
- 结果合并和存储

#### 任务 11: OpenRouter API 客户端
- 文本后处理客户端实现
- 多语言支持配置
- 质量优化处理

#### 任务 12: 后处理 API 路由
- 创建 `/api/postprocess` 路由
- 句子标准化处理
- 翻译和标注功能

### 第四阶段：用户界面 (第4-5天)

#### 任务 13: 基础 UI 布局
- 使用 Tailwind CSS 设计界面
- shadcn/ui 组件集成
- 响应式布局设计

#### 任务 14: 文件上传组件
- 拖放上传功能
- 文件列表显示
- 上传状态管理

#### 任务 15: 音频播放器组件
- 自定义音频播放器
- 进度控制功能
- 播放状态管理

#### 任务 16: 字幕同步系统
- 实时字幕显示
- 时间戳同步算法
- 二进制搜索优化

#### 任务 17: A-B 循环功能
- 影子学习循环控制
- 区间选择功能
- 循环播放逻辑

### 第五阶段：优化和测试 (第5天)

#### 任务 18: 错误处理机制
- 异常捕获和处理
- 指数退避重试
- 用户错误提示

#### 任务 19: 并发控制
- 最大并发数限制
- 任务队列管理
- 资源优化分配

#### 任务 20: 完整流程测试
- 端到端功能测试
- 性能基准测试
- 用户体验验证

#### 任务 21: 类型检查和代码质量
- TypeScript 类型检查
- ESLint 代码规范
- 代码质量优化

#### 任务 22: 构建测试
- 生产环境构建
- 打包优化检查
- 部署准备验证

## 环境变量要求

```bash
GROQ_API_KEY=您的Groq API密钥
OPENROUTER_API_KEY=您的OpenRouter API密钥
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=选择的后处理模型
MAX_CONCURRENCY=3
CHUNK_SECONDS=45
CHUNK_OVERLAP=0.2
```

## 开发命令

```bash
# 安装依赖
npm install

# 开发服务器
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm start

# 类型检查
npm run type-check

# 代码检查
npm run lint
```

## 优先级说明

1. **高优先级**: 数据库层、文件上传、基础API
2. **中优先级**: UI组件、字幕同步、错误处理
3. **低优先级**: 高级功能、性能优化

## 预期成果

完成 MVP 版本，包含：
- 音频文件上传和管理
- 语音转文字转录
- 文本后处理
- 基本播放控制
- 影子学习循环功能

## 后续阶段规划

- 术语词典支持
- 词级时间戳
- 波形可视化
- PWA 和移动端优化
- 导入导出功能
