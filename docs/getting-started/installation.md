# 安装指南

本指南将帮助您安装和设置 Shadowing Learning 应用程序，无论您是最终用户还是开发者。

## 🎯 安装选项

### 选项 1: 使用预构建的应用程序 (推荐用户)

#### 直接访问
1. 打开浏览器，访问 [https://your-app-url.com](https://your-app-url.com)
2. 注册账户或使用现有账户登录
3. 开始使用应用程序

#### 浏览器要求
- **Chrome 90+** (推荐)
- **Firefox 88+**
- **Safari 14+**
- **Edge 90+**

### 选项 2: 本地开发安装 (推荐开发者)

## 🔧 开发环境安装

### 系统要求
- **操作系统**: Windows 10+, macOS 10.15+, Linux
- **Node.js**: 18.0 或更高版本
- **内存**: 最少 4GB RAM (推荐 8GB+)
- **存储**: 最少 1GB 可用空间

### 步骤 1: 安装 Node.js

#### Windows
1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 LTS 版本 (18.x)
3. 运行安装程序
4. 验证安装:
   ```bash
   node --version
   npm --version
   ```

#### macOS
使用 Homebrew (推荐):
```bash
brew install node
```

或者下载官方安装包：
1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 macOS 安装包
3. 运行安装程序

#### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 步骤 2: 安装 pnpm

```bash
npm install -g pnpm
```

验证安装:
```bash
pnpm --version
```

### 步骤 3: 克隆项目

```bash
git clone https://github.com/your-repo/shadowing-learning.git
cd shadowing-learning
```

### 步骤 4: 安装依赖

```bash
pnpm install
```

### 步骤 5: 配置环境变量

1. 复制环境变量模板：
   ```bash
   cp .env.example .env.local
   ```

2. 编辑 `.env.local` 文件：
   ```bash
   nano .env.local
   ```

3. 添加必要的 API 密钥：
   ```env
   # API 密钥
   GROQ_API_KEY=your_groq_api_key_here
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
   OPENROUTER_MODEL=deepseek/deepseek-chat-v3.1:free

   # 性能配置
   MAX_CONCURRENCY=3
   CHUNK_SECONDS=45
   CHUNK_OVERLAP=0.2

   # 应用配置
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_APP_NAME="Shadowing Learning"
   ```

### 步骤 6: 启动开发服务器

```bash
pnpm dev
```

### 步骤 7: 验证安装

1. 打开浏览器，访问 `http://localhost:3000`
2. 您应该看到 Shadowing Learning 应用程序
3. 尝试上传音频文件进行测试

## 🐳 Docker 安装

### 使用 Docker Compose (推荐)

1. 确保已安装 Docker 和 Docker Compose

2. 克隆项目：
   ```bash
   git clone https://github.com/your-repo/shadowing-learning.git
   cd shadowing-learning
   ```

3. 创建环境文件：
   ```bash
   cp .env.example .env
   # 编辑 .env 文件
   ```

4. 启动服务：
   ```bash
   docker-compose up -d
   ```

5. 访问应用程序：`http://localhost:3000`

### 手动 Docker 构建

1. 构建镜像：
   ```bash
   docker build -t shadowing-learning .
   ```

2. 运行容器：
   ```bash
   docker run -p 3000:3000 \
     -e GROQ_API_KEY=your_key \
     -e OPENROUTER_API_KEY=your_key \
     shadowing-learning
   ```

## 🚀 生产环境部署

### Vercel 部署 (推荐)

1. **连接 GitHub 仓库**
   - 登录 [Vercel](https://vercel.com)
   - 点击 "New Project"
   - 选择您的 GitHub 仓库

2. **配置环境变量**
   - 在项目设置中添加环境变量
   - 添加所有必要的环境变量

3. **部署**
   - Vercel 会自动检测 Next.js 项目
   - 点击 "Deploy" 开始部署

### Netlify 部署

1. **连接 GitHub 仓库**
   - 登录 [Netlify](https://netlify.com)
   - 点击 "New site from Git"
   - 选择您的 GitHub 仓库

2. **构建设置**
   ```yaml
   Build command: pnpm run build
   Publish directory: .next
   Node version: 18
   ```

3. **环境变量**
   - 在 Site settings > Environment variables 中添加

### AWS ECS 部署

1. **构建和推送镜像**
   ```bash
   # 构建镜像
   docker build -t your-registry/shadowing-learning:latest .
   
   # 推送到镜像仓库
   docker push your-registry/shadowing-learning:latest
   ```

2. **部署到 ECS**
   - 使用 AWS 管理控制台或 CLI
   - 创建任务定义和服务

## 🔍 故障排除

### 常见问题

#### 1. Node.js 版本问题
```bash
# 检查 Node.js 版本
node --version

# 如果版本低于 18，升级 Node.js
# 使用 nvm 管理 Node.js 版本
nvm install 18
nvm use 18
```

#### 2. 依赖安装失败
```bash
# 清除缓存
pnpm store prune

# 删除 node_modules 和重新安装
rm -rf node_modules .next
pnpm install
```

#### 3. 端口冲突
```bash
# 如果 3000 端口被占用，使用其他端口
PORT=3001 pnpm dev
```

#### 4. API 密钥问题
```bash
# 验证环境变量
echo $GROQ_API_KEY
echo $OPENROUTER_API_KEY

# 测试 API 连接
curl -H "Authorization: Bearer $GROQ_API_KEY" https://api.groq.com/openai/v1/models
```

#### 5. 权限问题 (Linux/macOS)
```bash
# 给予脚本执行权限
chmod +x scripts/*.sh

# 修复文件权限
sudo chown -R $USER:$USER /path/to/project
```

### 日志和调试

#### 开发服务器日志
```bash
# 查看详细日志
pnpm dev --verbose

# 保存日志到文件
pnpm dev 2>&1 | tee dev.log
```

#### Docker 日志
```bash
# 查看 Docker 容器日志
docker logs shadowing-learning

# 实时查看日志
docker logs -f shadowing-learning
```

## 📚 下一步

安装完成后，您可以：

1. **配置应用程序**: 查看 [配置指南](configuration.md)
2. **开始使用**: 阅读 [首次使用](first-steps.md) 指南
3. **开发功能**: 查看 [开发设置](../development/setup.md) 指南
4. **了解架构**: 阅读 [系统架构](../architecture/system-design.md) 文档

## 🆘 获取帮助

如果安装过程中遇到问题：

1. **检查故障排除**: 查看 [故障排除](../user-guide/troubleshooting.md) 部分
2. **搜索已知问题**: 查看 [GitHub Issues](https://github.com/your-repo/shadowing-learning/issues)
3. **报告新问题**: 创建新的 GitHub Issue
4. **社区支持**: 加入 [GitHub Discussions](https://github.com/your-repo/shadowing-learning/discussions)

## 📝 系统要求总结

### 最低要求
- **CPU**: 双核 2GHz
- **内存**: 4GB RAM
- **存储**: 1GB 可用空间
- **网络**: 稳定的互联网连接

### 推荐配置
- **CPU**: 四核 2.5GHz+
- **内存**: 8GB RAM+
- **存储**: 2GB SSD
- **网络**: 宽带互联网连接

---

*安装指南 | 版本: 1.0 | 最后更新: 2024年9月22日*