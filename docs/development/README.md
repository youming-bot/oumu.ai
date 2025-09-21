# 开发者指南

欢迎使用 Shadowing Learning 项目的开发者指南！本文档为参与项目开发的开发者提供全面的资源。

## 📋 开发者资源

### 🚀 快速开始
- [开发环境设置](setup.md) - 配置您的开发环境
- [编码标准](coding-standards.md) - 了解项目的代码规范
- [测试策略](testing.md) - 掌握测试方法和最佳实践
- [完整开发指南](development-guide.md) - 全面的开发流程指南

### 🔧 核心开发概念
- **技术栈**: Next.js 15 + React 19 + TypeScript + shadcn/ui
- **状态管理**: 使用自定义 React hooks
- **数据持久化**: IndexedDB + Dexie
- **API 集成**: Groq Whisper + OpenRouter LLM
- **测试框架**: Jest + Testing Library

### 🛠️ 开发工具
- **代码质量**: Biome.js (linting + formatting)
- **包管理**: pnpm
- **版本控制**: Git + GitHub
- **开发服务器**: Next.js 内置开发服务器

## 🎯 开发工作流

### 1. 环境设置
```bash
# 克隆项目
git clone https://github.com/your-repo/shadowing-learning.git
cd shadowing-learning

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 添加 API 密钥

# 启动开发服务器
pnpm dev
```

### 2. 日常开发
```bash
# 运行类型检查
pnpm run type-check

# 代码质量检查
pnpm run lint

# 运行测试
pnpm test

# 构建项目
pnpm run build
```

### 3. 贡献流程
1. 创建功能分支：`git checkout -b feature/new-feature main`
2. 开发和提交：`git commit -m "feat: add new feature"`
3. 推送分支：`git push origin feature/new-feature`
4. 创建 Pull Request
5. 等待代码审查
6. 合并到主分支

## 📚 重要文档

### 必读文档
- [架构设计](../architecture/system-design.md) - 了解系统架构
- [API 参考](../api-reference/README.md) - API 集成指南
- [错误处理](error-handling.md) - 错误管理策略
- [部署指南](deployment.md) - 部署和运维

### 参考文档
- [代码审查报告](../code-review/README.md) - 当前项目状态分析
- [项目计划](../project-management/development-plan.md) - 开发路线图
- [术语表](../appendices/glossary.md) - 项目术语解释

## 🔍 开发者工具和配置

### VS Code 配置
项目包含完整的 VS Code 配置，包括：
- TypeScript 支持
- Biome.js 集成
- 调试配置
- 推荐扩展

### Pre-commit 钩子
项目配置了 pre-commit 钩子，确保代码质量：
- 自动代码格式化
- 代码质量检查
- 类型检查

### 测试配置
- 单元测试：Jest
- 集成测试：Testing Library
- 测试覆盖率要求：80%+

## 🎨 组件开发

### UI 组件
项目使用 shadcn/ui 组件库：
- 现代化设计系统
- 可访问性支持
- TypeScript 类型安全
- 主题支持

### 自定义 Hooks
项目包含多个自定义 hooks：
- `useAppState` - 全局应用状态
- `useAudioPlayer` - 音频播放控制
- `useFiles` - 文件管理
- `useTranscripts` - 转录数据处理

## 🧪 测试策略

### 测试类型
- **单元测试**: 测试独立函数和组件
- **集成测试**: 测试组件间的交互
- **E2E 测试**: 端到端用户流程测试

### 测试最佳实践
- 使用 Testing Library 进行组件测试
- Mock 外部依赖
- 测试用户交互，而不是实现细节
- 保持测试的可维护性

## 🚀 部署和发布

### 部署选项
- **Vercel**: 推荐的零配置部署
- **Netlify**: 另一个优秀的托管选项
- **Docker**: 容器化部署
- **自托管**: 完全控制的服务器部署

### 发布流程
1. 更新版本号
2. 更新 CHANGELOG
3. 创建发布分支
4. 运行完整测试套件
5. 部署到生产环境
6. 创建 GitHub Release

## 📊 监控和调试

### 开发工具
- React DevTools - 组件状态和性能分析
- 浏览器开发者工具 - 网络和性能调试
- Next.js 开发工具 - 构建和路由分析

### 日志和监控
- 应用内日志系统
- 错误跟踪 (可选 Sentry 集成)
- 性能监控

## 🆘 获取帮助

### 技术支持
- **GitHub Issues**: 报告 bug 和请求功能
- **GitHub Discussions**: 技术问题和讨论
- **Stack Overflow**: 使用项目标签提问

### 开发资源
- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://react.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [shadcn/ui 文档](https://ui.shadcn.com/)

### 社区
- 加入我们的 [Discord 服务器](https://discord.gg/shadowing-learning)
- 关注 [GitHub Discussions](https://github.com/your-repo/shadowing-learning/discussions)
- 订阅项目更新

## 🎯 贡献指南

### 贡献方式
1. **代码贡献**: 修复 bug、添加功能、改进文档
2. **文档改进**: 修复错误、添加示例、改进说明
3. **问题报告**: 报告 bug、建议改进
4. **社区参与**: 帮助其他用户、参与讨论

### 贡献准则
- 遵循项目编码标准
- 编写适当的测试
- 更新相关文档
- 保持向后兼容性
- 尊重项目许可证

---

*开发者指南 | 版本: 1.0 | 最后更新: 2024年9月22日*