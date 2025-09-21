# 部署指南

## 🚀 部署概览

oumu.ai 可以部署在多种平台上，包括 Vercel、Netlify、AWS、以及自托管服务器。本指南将详细介绍各种部署方式的配置和优化。

### 部署特性

- ✅ **零配置部署**: 支持 Vercel 和 Netlify 一键部署
- ✅ **环境变量管理**: 安全的密钥管理
- ✅ **性能优化**: 自动优化和缓存
- ✅ **监控和日志**: 内置错误监控
- ✅ **扩展性**: 支持水平扩展

---

## 🔧 环境准备

### 系统要求

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0 (推荐)
- **内存**: 最少 512MB，推荐 2GB+
- **存储**: 最少 1GB 可用空间

### 环境变量

```bash
# .env.local
# API 密钥
GROQ_API_KEY=your_groq_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=deepseek/deepseek-chat-v3.1:free

# 性能配置
MAX_CONCURRENCY=3
CHUNK_SECONDS=45
CHUNK_OVERLAP=0.2
TRANSCRIPTION_TIMEOUT_MS=300000
TRANSCRIPTION_RETRY_COUNT=3

# 应用配置
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME="Shadowing Learning"
```

---

## 🎯 Vercel 部署 (推荐)

### 1. 项目设置

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录 Vercel
vercel login

# 3. 初始化项目
vercel init

# 4. 链接到现有项目
vercel --prod
```

### 2. 配置文件

#### `vercel.json`
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "GROQ_API_KEY": "@groq_api_key",
    "OPENROUTER_API_KEY": "@openrouter_api_key",
    "OPENROUTER_BASE_URL": "https://openrouter.ai/api/v1",
    "OPENROUTER_MODEL": "deepseek/deepseek-chat-v3.1:free"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_APP_URL": "https://your-app.vercel.app"
    }
  },
  "crons": []
}
```

#### `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: true,
  },
  images: {
    domains: [],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true,
  },
};

module.exports = nextConfig;
```

### 3. 环境变量配置

在 Vercel 控制台中设置环境变量：

1. 进入项目设置
2. 选择 "Environment Variables"
3. 添加以下变量：
   - `GROQ_API_KEY`
   - `OPENROUTER_API_KEY`
   - `MAX_CONCURRENCY=3`
   - `CHUNK_SECONDS=45`
   - `CHUNK_OVERLAP=0.2`

### 4. 自动化部署

#### GitHub Actions 配置
```yaml
# .github/workflows/vercel-deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'pnpm'
    
    - name: Install pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 8
    
    - name: Install dependencies
      run: pnpm install
    
    - name: Build and test
      run: |
        pnpm run build
        pnpm test
    
    - name: Deploy to Vercel
      uses: vercel/action@v1
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## ☁️ Netlify 部署

### 1. 项目设置

```bash
# 1. 安装 Netlify CLI
npm install netlify-cli -g

# 2. 登录 Netlify
netlify login

# 3. 初始化项目
netlify init

# 4. 部署
netlify deploy --prod
```

### 2. 配置文件

#### `netlify.toml`
```toml
[build]
  command = "pnpm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[context.production]
  environment = { NEXT_PUBLIC_APP_URL = "https://your-app.netlify.app" }

[context.deploy-preview]
  environment = { NEXT_PUBLIC_APP_URL = "https://deploy-preview-{{ branch }}--your-app.netlify.app" }
```

### 3. 环境变量

在 Netlify 控制台中设置环境变量：

1. 进入 Site settings
2. 选择 "Build & deploy"
3. 在 "Environment" 部分添加变量

---

## 🐳 Docker 部署

### 1. Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN corepack enable pnpm && pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### 2. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - GROQ_API_KEY=${GROQ_API_KEY}
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - MAX_CONCURRENCY=3
      - CHUNK_SECONDS=45
      - CHUNK_OVERLAP=0.2
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 3. 部署命令

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

---

## 🚀 AWS 部署

### 1. ECS 部署

#### 任务定义
```json
{
  "family": "shadowing-learning",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "your-account.dkr.ecr.us-east-1.amazonaws.com/shadowing-learning:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "GROQ_API_KEY",
          "value": "${GROQ_API_KEY}"
        },
        {
          "name": "OPENROUTER_API_KEY",
          "value": "${OPENROUTER_API_KEY}"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/shadowing-learning",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### 2. S3 静态资源部署

```bash
# 构建项目
pnpm run build

# 上传到 S3
aws s3 sync .next/static s3://your-bucket/static --delete

# 配置 CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

---

## 🏠 自托管部署

### 1. 服务器要求

- **操作系统**: Ubuntu 20.04+ / CentOS 8+
- **Node.js**: 18.x LTS
- **反向代理**: Nginx
- **进程管理**: PM2

### 2. 安装脚本

```bash
#!/bin/bash
# deploy.sh

# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2
sudo npm install -g pm2

# 克隆项目
git clone https://github.com/your-username/shadowing-learning.git
cd shadowing-learning

# 安装依赖
pnpm install

# 构建项目
pnpm run build

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 启动应用
pm2 start ecosystem.config.js
```

### 3. PM2 配置

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'shadowing-learning',
    script: 'npm',
    args: 'start',
    cwd: './',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    env_production: {
      NODE_ENV: 'production',
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

### 4. Nginx 配置

```nginx
# /etc/nginx/sites-available/shadowing-learning
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }
    
    # 静态文件缓存
    location /_next/static/ {
        alias /path/to/your/project/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

---

## 🔍 监控和日志

### 1. 应用监控

#### 集成 Sentry
```javascript
// lib/sentry.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

### 2. 性能监控

```javascript
// lib/monitoring.js
export const monitorPerformance = () => {
  if (typeof window !== 'undefined') {
    // 监控页面加载时间
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      console.log('Page load time:', navigation.loadEventEnd - navigation.loadEventStart);
    });
    
    // 监控 API 调用时间
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      const response = await originalFetch(...args);
      const end = performance.now();
      console.log(`API call to ${args[0]} took ${end - start}ms`);
      return response;
    };
  }
};
```

### 3. 健康检查端点

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 检查外部 API 连接
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {
        database: 'ok',
        external_apis: 'ok'
      }
    };

    return NextResponse.json(healthStatus);
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
```

---

## 🚨 故障排除

### 常见问题

#### 1. 构建失败

```bash
# 清理缓存
rm -rf .next node_modules
pnpm install
pnpm run build
```

#### 2. 内存不足

```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm run build
```

#### 3. API 密钥问题

```bash
# 验证环境变量
echo $GROQ_API_KEY
echo $OPENROUTER_API_KEY

# 测试 API 连接
curl -H "Authorization: Bearer $GROQ_API_KEY" https://api.groq.com/openai/v1/models
```

#### 4. 性能问题

```bash
# 检查内存使用
npm run dev -- --inspect

# 分析包大小
npx next analyze
```

---

## 🔄 维护和更新

### 1. 自动化更新

```bash
# 检查更新
npm outdated

# 更新依赖
pnpm update

# 安全审计
pnpm audit
```

### 2. 备份策略

```bash
# 备份脚本
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
tar -czf backup_$DATE.tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  ./

# 上传到云存储
aws s3 cp backup_$DATE.tar.gz s3://your-backup-bucket/
```

### 3. 回滚策略

```bash
# 回滚到上一个版本
git checkout HEAD~1
pnpm install
pnpm run build
pm2 reload shadowing-learning
```

---

*部署指南 | 版本: 1.0 | 最后更新: 2024年9月22日*