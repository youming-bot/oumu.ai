# 系统架构设计

## 🏗️ 总体架构

### 架构概览

oumu.ai 是一个基于 Next.js 15 的现代化 web 应用，采用客户端-服务器架构，专注于语言学习的音频处理和文本分析。

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Side   │    │   Server Side   │    │   External APIs │
│                 │    │                 │    │                 │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │   React   │  │    │  │ Next.js   │  │    │  │   Groq    │  │
│  │ 19 + TS   │  │────│  │  API      │  │────│  │ Whisper   │  │
│  │ + Hooks   │  │    │  │ Routes    │  │    │  │ API       │  │
│  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │
│                 │    │                 │    │                 │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │ shadcn/ui │  │    │  │ Middleware│  │    │  │ OpenRouter│  │
│  │ Components│  │    │  │ & Auth    │  │    │  │ LLM API   │  │
│  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │
│                 │    │                 │    │                 │
│  ┌───────────┐  │    │                 │    │  ┌───────────┐  │
│  │ IndexedDB │  │    │                 │    │  │HuggingFace│  │
│  │ (Dexie)   │  │    │                 │    │  │  API      │  │
│  └───────────┘  │    │                 │    │  └───────────┘  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 核心设计原则

1. **客户端优先**: 所有用户数据存储在客户端 IndexedDB
2. **无服务器持久化**: 音频文件处理后不存储在服务器
3. **模块化架构**: 清晰的分层和组件化设计
4. **类型安全**: 严格的 TypeScript 类型系统
5. **响应式设计**: 适配多种设备和屏幕尺寸

## 📁 技术栈分层

### 前端层 (Frontend Layer)

```
Frontend Layer
├── UI Components (shadcn/ui)
│   ├── Layout Components
│   ├── Form Components
│   ├── Display Components
│   └── Navigation Components
├── Business Logic
│   ├── Custom Hooks (8 hooks)
│   ├── State Management
│   └── Business Rules
└── Data Layer
    ├── IndexedDB (Dexie)
    ├── API Clients
    └── Local Storage
```

#### 关键技术选择理由

- **Next.js 15**: 最新的 React 框架，支持 App Router
- **React 19**: 最新版本，提供最佳性能和开发体验
- **TypeScript**: 类型安全，减少运行时错误
- **shadcn/ui**: 现代化、可定制的 UI 组件库
- **Tailwind CSS**: 实用优先的 CSS 框架

### 后端层 (Backend Layer)

```
Backend Layer
├── API Routes
│   ├── /api/transcribe (Groq/HuggingFace)
│   ├── /api/postprocess (OpenRouter)
│   └── /api/progress/[fileId]
├── Middleware
│   ├── CORS Handling
│   ├── Rate Limiting
│   └── Security Headers
└── Static Assets
    ├── Public Files
    ├── Images
    └── Fonts
```

#### 后端设计决策

- **API Routes**: 轻量级后端，专注于外部 API 集成
- **无状态设计**: 每个请求独立处理，无服务器状态
- **流式处理**: 音频文件流式传输到外部 API
- **安全性**: API 密钥仅在服务器端使用

### 数据层 (Data Layer)

```
Data Layer
├── IndexedDB (Dexie ORM)
│   ├── Files Table
│   ├── Transcripts Table
│   ├── Segments Table
│   └── Terms Table
├── External APIs
│   ├── Groq Whisper API
│   ├── OpenRouter LLM API
│   └── HuggingFace API
└── Local Storage
    ├── User Preferences
    └── Application State
```

#### 数据层设计原则

- **本地优先**: 所有用户数据存储在客户端
- **隐私保护**: 敏感数据不上传到服务器
- **离线支持**: 应用可离线使用
- **自动迁移**: 数据库版本管理和自动迁移

## 🔄 数据流架构

### 音频处理流程

```
Audio Upload → Validation → Chunk Processing → Transcription → Post-processing → Storage
     │              │              │                  │               │          │
     ▼              ▼              ▼                  ▼               ▼          ▼
  File Store    Size/Type      45s Chunks        Groq/HF         OpenRouter    IndexedDB
  (Blob)        Check        + Overlap         Whisper API      LLM API      + Search
```

### 详细处理步骤

1. **文件上传验证**
   - 文件类型检查（音频格式）
   - 文件大小限制
   - 存储到 IndexedDB

2. **音频分块处理**
   - 45秒分块，0.2秒重叠
   - 并发控制（最大3个）
   - WAV 格式转换

3. **转录处理**
   - 流式传输到 Groq/HuggingFace
   - 实时进度跟踪
   - 错误处理和重试

4. **文本后处理**
   - OpenRouter LLM 处理
   - 文本标准化
   - 注释和拼音生成

5. **数据存储**
   - 分段存储到 IndexedDB
   - 搜索索引构建
   - 缓存优化

### 状态管理流程

```
User Interaction → UI State → Business Logic → Data State → Persistence
        │              │            │             │            │
        ▼              ▼            ▼             ▼            ▼
   React Event     useState    Custom Hook    IndexedDB    Auto-save
  (onClick etc.)   / useReducer   Logic         Database     + Sync
```

## 🎯 核心组件架构

### 音频处理组件

```typescript
Audio Processing Pipeline
├── AudioProcessor (lib/audio-processor.ts)
│   ├── Audio Chunking
│   ├── Format Conversion
│   └── Duration Calculation
├── TranscriptionService (lib/transcription-service.ts)
│   ├── API Integration
│   ├── Progress Tracking
│   └── Error Handling
└── WordTimestampService (lib/word-timestamp-service.ts)
    ├── Word-level Timing
    ├── Binary Search
    └── Synchronization
```

### UI 组件层次

```
UI Component Hierarchy
├── Layout Components
│   ├── MainLayout
│   ├── Header
│   └── Sidebar
├── Feature Components
│   ├── FileUpload
│   ├── AudioPlayer
│   ├── SubtitleDisplay
│   └── TerminologyGlossary
├── Shared Components
│   ├── Button
│   ├── Card
│   ├── Input
│   └── Modal
└── Utility Components
    ├── LoadingSpinner
    ├── ErrorBoundary
    └── KeyboardShortcutsHelp
```

### 自定义 Hooks 架构

```typescript
Custom Hooks (8 hooks)
├── useAppState (全局应用状态)
│   ├── UI Preferences
│   ├── Theme Settings
│   └── User Settings
├── useAudioPlayer (音频播放控制)
│   ├── Playback State
│   ├── A-B Looping
│   └── Timing Synchronization
├── useFiles (文件管理)
│   ├── File Upload
│   ├── File Validation
│   └── File Organization
├── useTranscripts (转录数据)
│   ├── Transcript Processing
│   ├── Status Tracking
│   └── Data Validation
├── useTranscriptionProgress (进度跟踪)
│   ├── Real-time Progress
│   ├── Error Handling
│   └── Completion Detection
├── useTerms (术语管理)
│   ├── CRUD Operations
│   ├── Search & Filter
│   └── Import/Export
├── useMemoryCleanup (内存优化)
│   ├── Large File Cleanup
│   ├── Memory Monitoring
│   └── Performance Optimization
├── useAbLoop (循环控制)
│   ├── Loop Points
│   ├── Loop Playback
│   └── User Interface
└── useKeyboardControls (键盘快捷键)
    ├── Keyboard Events
    ├── Shortcut Management
    └── Accessibility
```

## 🔒 安全架构

### 安全策略

1. **API 密钥保护**
   - 所有 API 密钥存储在环境变量中
   - 仅在服务器端 API 路由中使用
   - 永远不暴露给客户端

2. **数据安全**
   - 音频文件处理流式传输，不持久化
   - 用户数据仅存储在客户端 IndexedDB
   - XSS 防护通过 DOMPurify

3. **访问控制**
   - CORS 严格配置
   - Rate Limiting 防止滥用
   - 安全头设置

4. **输入验证**
   - 所有用户输入验证
   - 文件类型和大小限制
   - Zod Schema 运行时验证

### 安全流程

```
User Input → Client Validation → Server Validation → API Processing → Response
      │            │                  │                │              │
      ▼            ▼                  ▼                ▼              ▼
  Form Data    Zod Schema        API Route        External API    Sanitized
  (Client)     Validation      Middleware        Integration     Response
```

## 📊 性能架构

### 性能优化策略

1. **音频处理优化**
   - 45秒分块，平衡精度和性能
   - 并发控制，避免浏览器限制
   - 二分搜索算法，O(log n) 时间复杂度

2. **UI 性能优化**
   - React.memo 和 useMemo 使用
   - 虚拟滚动处理大量数据
   - 防抖和节流控制更新频率

3. **数据存储优化**
   - IndexedDB 索引优化
   - 数据分页和懒加载
   - 内存清理和垃圾回收

4. **网络性能优化**
   - 请求缓存和去重
   - 增量数据传输
   - 错误重试机制

### 性能监控

```typescript
Performance Monitoring
├── Audio Processing Time
│   ├── Chunk Processing
│   ├── API Response Time
│   └── Total Processing Time
├── UI Performance
│   ├── Component Render Time
│   ├── State Update Time
│   └── User Interaction Latency
└── Resource Usage
    ├── Memory Usage
    ├── CPU Usage
    └── Network Bandwidth
```

## 🚀 扩展性设计

### 横向扩展

1. **微服务架构准备**
   - API 路由模块化设计
   - 独立的服务边界
   - 标准化的接口设计

2. **数据库扩展**
   - IndexedDB 分片策略
   - 数据分区和归档
   - 缓存层次设计

3. **负载均衡**
   - 请求分发策略
   - 故障转移机制
   - 性能监控和报警

### 功能扩展

1. **插件系统**
   - 标准化的插件接口
   - 动态加载机制
   - 配置管理

2. **多语言支持**
   - 国际化框架
   - 本地化资源管理
   - 动态语言切换

3. **AI 模型扩展**
   - 多模型支持
   - 模型版本管理
   - 性能对比和选择

## 📈 监控和分析

### 应用监控

```typescript
Application Monitoring
├── Error Tracking
│   ├── Runtime Errors
│   ├── API Errors
│   └── User Action Errors
├── Performance Metrics
│   ├── Page Load Time
│   ├── API Response Time
│   └── User Interaction Metrics
└── User Analytics
    ├── Feature Usage
    ├── User Behavior
    └── Performance Metrics
```

### 日志系统

```typescript
Logging System
├── Client Logs
│   ├── Debug Logs (Development)
│   ├── Error Logs (Production)
│   └── Performance Logs
├── Server Logs
│   ├── API Access Logs
│   ├── Error Logs
│   └── Performance Logs
└── External API Logs
    ├── Request/Response Logs
    ├── Error Logs
    └── Usage Statistics
```

---

*系统架构文档 | 版本: 1.0 | 最后更新: 2024年9月22日*