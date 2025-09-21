# 术语表

本文档包含 Shadowing Learning 项目中使用的技术术语和概念的定义。

## 🎵 音频处理术语

### Shadowing Learning (影子跟读)
一种语言学习技术，学习者模仿母语者的语音、语调和节奏来提高口语流利度。

### Transcription (转录)
将音频转换为文本的过程，本项目使用 AI 模型实现自动转录。

### Word Timestamps (单词时间戳)
每个单词在音频中的精确开始和结束时间信息，用于字幕同步。

### Audio Chunking (音频分块)
将长音频文件分割成小块进行处理，本项目使用 45 秒分块。

### Overlap (重叠)
音频分块之间的重叠部分，防止转录在分块边界处丢失信息。

### WAV Format
音频文件格式，用于处理过程中的中间格式。

## 🧠 AI/ML 术语

### Whisper
OpenAI 开发的语音识别模型，Groq 提供优化版本。

### HuggingFace
开源 AI 模型和工具平台，本项目使用其 Whisper 模型。

### OpenRouter
AI 模型聚合服务，提供对多种 LLM 的访问。

### Large Language Model (LLM)
大型语言模型，用于文本处理和分析。

### Text Normalization (文本标准化)
将转录文本转换为标准格式，包括标点、大小写等。

### Furigana (振假名)
日语汉字上面的注音，帮助学习者正确发音。

## 💻 技术栈术语

### Next.js
React 框架，用于构建现代 Web 应用程序。

### React 19
用于构建用户界面的 JavaScript 库。

### TypeScript
JavaScript 的超集，添加了静态类型系统。

### shadcn/ui
基于 Radix UI 的现代 React 组件库。

### Tailwind CSS
实用优先的 CSS 框架。

### IndexedDB
浏览器内置的 NoSQL 数据库。

### Dexie
IndexedDB 的现代化封装库。

## 🎨 UI/UX 术语

### Component (组件)
可重用的 UI 构建块。

### Hook (钩子)
React 16.8+ 引入的特性，用于在函数组件中使用状态和其他 React 特性。

### State Management (状态管理)
管理应用程序状态的方式和策略。

### Responsive Design (响应式设计)
使应用程序适应不同屏幕尺寸的设计方法。

### A-B Looping (A-B 循环)
在音频的指定时间段内循环播放，用于语言学习练习。

## 🗄️ 数据存储术语

### IndexedDB
浏览器端的事务型数据库系统。

### Database Migration (数据库迁移)
数据库结构变更的管理过程。

### Schema (模式)
数据库的结构定义。

### CRUD Operations
创建、读取、更新、删除操作的统称。

### Blob (二进制大对象)
存储二进制数据的数据库类型。

## 🧪 测试术语

### Unit Test (单元测试)
对软件中最小可测试单元的测试。

### Integration Test (集成测试)
测试不同组件或系统之间的交互。

### End-to-End Test (端到端测试)
模拟真实用户操作的完整测试。

### Mock (模拟)
在测试中替代真实对象的测试替身。

### Test Coverage (测试覆盖率)
代码被测试覆盖的程度。

## 🔧 开发工具术语

### Biome.js
JavaScript 和 TypeScript 的代码检查和格式化工具。

### pnpm
快速的、节省磁盘空间的包管理器。

### ESLint
JavaScript 代码检查工具（本项目已迁移到 Biome.js）。

### Prettier
代码格式化工具（功能已集成到 Biome.js）。

### Git
分布式版本控制系统。

### GitHub
基于 Git 的代码托管和协作平台。

## 🌐 Web 开发术语

### API (Application Programming Interface)
应用程序编程接口，定义软件组件之间的交互。

### REST API
遵循 REST 架构风格的 API。

### JSON (JavaScript Object Notation)
轻量级数据交换格式。

### CORS (Cross-Origin Resource Sharing)
跨域资源共享机制。

### Middleware (中间件)
处理请求和响应的软件层。

## 📊 性能术语

### Optimization (优化)
提高系统性能的过程。

### Caching (缓存)
存储频繁访问数据的机制。

### Lazy Loading (懒加载)
推迟加载非关键资源的技术。

### Debouncing (防抖)
限制函数调用频率的技术。

### Throttling (节流)
限制函数执行频率的技术。

## 🔒 安全术语

### XSS (Cross-Site Scripting)
跨站脚本攻击，一种常见的 Web 安全漏洞。

### CSRF (Cross-Site Request Forgery)
跨站请求伪造，强制用户执行非预期操作的攻击。

### API Key (API 密钥)
用于身份验证的密钥。

### Environment Variables (环境变量)
存储敏感配置信息的机制。

### DOMPurify
HTML 清理和消毒库，用于防止 XSS 攻击。

## 🚀 部署术语

### Vercel
云平台，用于部署和托管 Next.js 应用程序。

### Netlify
云平台，提供静态网站托管和 CI/CD。

### Docker
容器化平台，用于打包和部署应用程序。

### CI/CD (Continuous Integration/Continuous Deployment)
持续集成和持续部署的实践。

### Production Environment (生产环境)
供最终用户使用的实际运行环境。

## 📈 项目管理术语

### Agile (敏捷)
强调迭代开发和团队协作的项目管理方法。

### Sprint (冲刺)
固定时间的开发周期。

### Pull Request (PR)
请求将代码变更合并到主分支的机制。

### Code Review (代码审查)
同行评审代码以提高质量的过程。

### Technical Debt (技术债务)
为快速开发而采取的捷径，可能导致未来的维护成本。

## 🎯 功能术语

### File Upload (文件上传)
用户将音频文件上传到应用程序的功能。

### Progress Tracking (进度跟踪)
监控和显示长时间运行任务进度的功能。

### Real-time Synchronization (实时同步)
保持多个组件状态一致的功能。

### Export/Import (导出/导入)
在不同格式之间转换和传输数据的功能。

### Search Functionality (搜索功能)
快速查找和定位特定内容的功能。

## 🌍 国际化术语

### i18n (Internationalization)
国际化，设计软件以支持多种语言和地区。

### l10n (Localization)
本地化，将软件适应特定语言和地区的过程。

### UTF-8
Unicode 字符编码，支持多语言文本。

### Locale (地区)
特定语言和地区的组合。

## 📱 移动端术语

### Responsive Design (响应式设计)
适应不同屏幕尺寸的设计方法。

### Touch Events (触摸事件)
移动设备上的触摸交互。

### PWA (Progressive Web App)
渐进式 Web 应用，提供类似原生应用的用户体验。

### Service Worker
在后台运行的脚本，管理缓存和网络请求。

## 🔍 监控术语

### Logging (日志记录)
记录应用程序事件和错误的过程。

### Error Tracking (错误跟踪)
监控和报告应用程序错误的过程。

### Performance Monitoring (性能监控)
跟踪应用程序性能指标的过程。

### Analytics (分析)
收集和分析用户数据以改进产品。

### Uptime (正常运行时间)
系统可用和运行的时间百分比。

---

*术语表 | 版本: 1.0 | 最后更新: 2024年9月22日*