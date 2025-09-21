# Shadowing Learning 文档中心

欢迎来到 oumu.ai (Shadowing Learning) 项目的综合文档中心。本文档为不同用户角色和需求提供全面的指导。

## 📚 文档结构

### 🚀 快速开始
- **适合新用户和开发者**
- [快速入门指南](getting-started/README.md)
- [安装指南](getting-started/installation.md)
- [配置说明](getting-started/configuration.md)
- [首次使用](getting-started/first-steps.md)

### 👥 用户指南
- **适合应用程序的最终用户**
- [功能概览](user-guide/features.md)
- [常用工作流](user-guide/workflows.md)
- [故障排除](user-guide/troubleshooting.md)

### 🏗️ 架构设计
- **适合系统架构师和技术利益相关者**
- [系统架构](architecture/system-design.md)
- [组件架构](architecture/components.md)
- [代码审查报告](code-review/README.md)
- [问题摘要](code-review/issues-summary.md)

### 💻 开发指南
- **适合参与项目的开发者**
- [开发环境设置](development/setup.md)
- [编码标准](development/coding-standards.md)
- [测试策略](development/testing.md)
- [错误处理](development/error-handling.md)
- [部署指南](development/deployment.md)
- [完整开发指南](development/development-guide.md)

### 🔌 API 参考
- **适合与系统集成的人员**
- [API 概览](api-reference/README.md)

### 🔄 迁移历史
- **适合管理系统变更的人员**
- [迁移历史](migrations/README.md)
- [Biome.js 迁移](migrations/biome-migration.md)
- [数据库迁移](migrations/database-migrations.md)

### 📊 项目管理
- **适合项目经理和团队负责人**
- [任务跟踪](project-management/task-tracking.md)
- [开发计划](project-management/development-plan.md)
- [实施计划](project-management/implementation-plan.md)
- [活跃计划](project-management/active-plan.md)

### 📖 附录
- **参考材料和额外信息**
- [术语表](appendices/glossary.md)
- [贡献指南](appendices/contributing.md)

## 🔍 快速导航

### 项目新手？
从 [快速入门](getting-started/README.md) 开始，获取项目概览和设置说明。

### 想使用应用程序？
查看 [用户指南](user-guide/README.md) 了解功能文档和使用说明。

### 需要了解系统？
查看 [架构设计](architecture/README.md) 了解系统设计和技术细节。

### 计划贡献？
阅读 [开发指南](development/README.md) 和 [贡献指南](appendices/contributing.md)。

### 需要部署？
按照 [部署指南](development/deployment.md) 进行生产环境设置。

### 遇到问题？
查看 [故障排除](user-guide/troubleshooting.md) 了解常见问题和解决方案。

## 🛠️ 项目概览

Shadowing Learning 项目是一个基于网络的语言学习应用程序，通过音频转录和文本处理进行语言练习。使用 Next.js 15、React 19、TypeScript 和 shadcn/ui 构建，提供：

- **音频处理**: 基于 Groq Whisper 的分块音频转录
- **文本处理**: OpenRouter 支持的 AI 文本标准化
- **交互式学习**: 同步字幕和 A-B 循环功能
- **现代 UI**: 响应式设计，使用 shadcn/ui 组件
- **离线支持**: 使用 IndexedDB 进行本地数据持久化

## 📋 文档结构统计

### 完整文件组织
文档按逻辑部分组织，提供全面覆盖：

#### 核心文档 (35+ 文件)
- **快速入门** (4 文件): 设置、安装、配置、首次使用
- **用户指南** (3 文件): 功能、工作流、故障排除
- **架构设计** (4 文件): 系统设计、组件、代码审查
- **开发指南** (6 文件): 设置、编码标准、测试、错误处理、部署
- **API 参考** (1 文件): API 文档概览
- **迁移历史** (3 文件): Biome.js、数据库、迁移历史
- **项目管理** (4 文件): 任务跟踪、开发计划、实施
- **附录** (2 文件): 术语表、贡献指南

### 文档特性
- **用户为中心**: 按用户角色和需求组织
- **全面性**: 涵盖从设置到部署的所有方面
- **实用性**: 包含真实示例和故障排除
- **可维护性**: 清晰的结构便于更新
- **可访问性**: 为不同技术水平编写

## 📞 支持

如需技术问题或支持：
- 查看 [故障排除](user-guide/troubleshooting.md) 部分
- 查看 [GitHub Issues](https://github.com/your-repo/shadowing-learning/issues)
- 在 [GitHub Discussions](https://github.com/your-repo/shadowing-learning/discussions) 中提问
- 联系开发团队

## 📄 许可证

本项目采用 MIT 许可证。查看项目仓库了解详情。

## 🔄 文档更新

本文档持续改进。如需最新更改：
- 查看 [提交历史](https://github.com/your-repo/shadowing-learning/commits/main/docs)
- 查看 [GitHub Issues](https://github.com/your-repo/shadowing-learning/issues) 了解文档请求
- 提交 [pull requests](https://github.com/your-repo/shadowing-learning/pulls) 进行改进

## 🎯 主要改进亮点

### 新增文档 (基于代码审查)
- **代码审查报告**: 深度分析项目现状和改进建议
- **问题摘要**: 详细的问题列表和修复方案
- **架构设计**: 完整的系统架构和组件设计文档
- **API 参考**: 全面的 API 文档和集成指南
- **部署指南**: 多平台部署策略和最佳实践

### 文档质量提升
- **统一标准**: 使用 Biome.js 进行格式化和代码质量检查
- **中文优先**: 所有文档都提供中文版本
- **实用导向**: 强调实际应用和问题解决
- **维护友好**: 清晰的结构和版本控制支持

---

*最后更新: 2024年9月22日 | 文档重新组织和扩展完成*