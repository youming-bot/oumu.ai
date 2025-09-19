# Deployment Guide

This guide covers deploying the Shadowing Learning application to production environments.

## 🚀 Deployment Overview

The Shadowing Learning application is a Next.js application that can be deployed to various platforms. This guide covers deployment to different environments and best practices.

## 🎯 Deployment Targets

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Environment variables setup
vercel env add GROQ_API_KEY
vercel env add OPENROUTER_API_KEY
vercel env add OPENROUTER_BASE_URL
vercel env add OPENROUTER_MODEL
```

### Netlify
```bash
# Build command
npm run build

# Publish directory
.out

# Environment variables
# Set in Netlify dashboard
```

### Docker
```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Traditional Server
```bash
# Build application
npm run build

# Start production server
npm start

# Or with PM2
npm install -g pm2
pm2 start ecosystem.config.js
```

## 🔧 Environment Configuration

### Production Environment Variables
```env
# Required API Keys
GROQ_API_KEY=your_groq_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# OpenRouter Configuration
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=deepseek/deepseek-chat-v3.1:free

# Processing Configuration
MAX_CONCURRENCY=3
CHUNK_SECONDS=45
CHUNK_OVERLAP=0.2

# Next.js Configuration
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Optional Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Development Environment Variables
```env
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1

# Use test API keys for development
GROQ_API_KEY=your_test_groq_key
OPENROUTER_API_KEY=your_test_openrouter_key
```

## 📦 Build Process

### Production Build
```bash
# Clean build
rm -rf .next out

# Install dependencies
pnpm install

# Type check
pnpm type-check

# Lint and format
pnpm check

# Run tests
pnpm test

# Build application
pnpm build
```

### Build Optimization
```javascript
// next.config.js
const nextConfig = {
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-*']
  },
  images: {
    domains: ['your-domain.com']
  },
  compress: true,
  poweredByHeader: false
};

module.exports = nextConfig;
```

## 🏗️ Architecture Considerations

### Serverless Deployment
- **Cold Starts**: Optimize for fast initialization
- **Function Size**: Keep bundles small
- **Memory Limits**: Monitor memory usage
- **Execution Time**: Stay within limits

### Traditional Server
- **Process Management**: Use PM2 or similar
- **Reverse Proxy**: Nginx or Apache
- **SSL/TLS**: HTTPS configuration
- **Monitoring**: Application health checks

### Database Considerations
- **IndexedDB**: Client-side only, no server database needed
- **Storage**: User data remains in browser
- **Privacy**: No data persistence on server
- **Backup**: Not applicable (client-side data)

## 🔒 Security Best Practices

### Environment Variables
- **Never commit**: Keep all secrets in environment variables
- **Limited access**: Restrict access to production secrets
- **Regular rotation**: Rotate API keys periodically
- **Monitoring**: Monitor for unusual usage patterns

### CORS Configuration
```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://your-domain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' }
        ]
      }
    ];
  }
};
```

### Rate Limiting
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Implement rate limiting logic
  const ip = request.ip ?? request.headers.get('x-forwarded-for');

  // Check rate limits
  if (isRateLimited(ip)) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  return NextResponse.next();
}
```

## 📊 Monitoring and Logging

### Application Monitoring
```typescript
// lib/monitoring.ts
export class MonitoringService {
  static logError(error: Error, context?: any) {
    console.error('Application Error:', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }

  static logPerformance(metric: string, value: number) {
    console.log('Performance Metric:', {
      metric,
      value,
      timestamp: new Date().toISOString()
    });
  }
}
```

### Error Tracking
- **Sentry**: Error tracking and monitoring
- **LogRocket**: Session replay and debugging
- **Custom Monitoring**: Application-specific metrics

### Performance Monitoring
```typescript
// lib/performance.ts
export class PerformanceMonitor {
  static measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();

    console.log(`${name} took ${end - start}ms`);
    return result;
  }
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

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

    - name: Install dependencies
      run: pnpm install

    - name: Type check
      run: pnpm type-check

    - name: Lint
      run: pnpm lint

    - name: Test
      run: pnpm test

    - name: Build
      run: pnpm build

    - name: Deploy to Vercel
      uses: vercel/action@v1
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## 🧪 Testing in Production

### Feature Flags
```typescript
// lib/feature-flags.ts
export const FEATURES = {
  NEW_TRANSCRIPTION_ENGINE: process.env.FEATURE_NEW_ENGINE === 'true',
  ADVANCED_AUDIO_PROCESSING: process.env.FEATURE_ADVANCED_AUDIO === 'true'
};

export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature];
}
```

### A/B Testing
```typescript
// lib/ab-testing.ts
export function getVariant(userId: string, testId: string): string {
  // Simple hash-based variant assignment
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

  return hash % 2 === 0 ? 'A' : 'B';
}
```

## 🚨 Rollback Strategy

### Quick Rollback
```bash
# Vercel rollback
vercel rollback

# Or deploy previous version
git checkout HEAD~1
vercel --prod
```

### Database Considerations
- **No server database**: IndexedDB is client-only
- **User data**: No migration needed for rollbacks
- **API compatibility**: Ensure backward compatibility

## 📚 Documentation Updates

### Deployment Checklist
- [ ] Update deployment documentation
- [ ] Update environment variables
- [ ] Test deployment process
- [ ] Verify all functionality
- [ ] Monitor post-deployment metrics

### Communication
- **Team notification**: Inform team of deployment
- **Release notes**: Document changes and improvements
- **User communication**: Notify users of downtime or changes

---

*This guide is part of the Development series. See [Development](README.md) for more resources.*