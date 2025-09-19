# Configuration Guide

This guide explains how to configure the Shadowing Learning application for different environments and use cases.

## ⚙️ Configuration Overview

The application uses environment variables and configuration files to control behavior. Configuration is organized into several categories:

- **Environment Variables**: Runtime configuration
- **API Configuration**: External service settings
- **Processing Configuration**: Audio and text processing settings
- **UI Configuration**: User interface preferences
- **Development Configuration**: Development-specific settings

---

## 📋 Environment Variables

### Required Variables

These variables must be set for the application to function:

```env
# API Keys (REQUIRED)
GROQ_API_KEY=your_groq_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here

# API Configuration
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=deepseek/deepseek-chat-v3.1:free
```

### Optional Variables

These variables control application behavior:

```env
# Application Settings
NODE_ENV=development
PORT=3000
HOST=localhost

# Processing Configuration
MAX_CONCURRENCY=3
CHUNK_SECONDS=45
CHUNK_OVERLAP=0.2
MAX_FILE_SIZE=100MB
SUPPORTED_FORMATS=mp3,wav,m4a,ogg

# Feature Flags
ENABLE_OFFLINE_MODE=true
ENABLE_ANALYTICS=false
ENABLE_DEBUG_LOGGING=false

# Database Configuration
DB_NAME=shadowing_learning
DB_VERSION=1

# Security Settings
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60000
```

---

## 🔑 API Configuration

### Groq API Configuration

The Groq API provides speech-to-text transcription services.

#### Required Setup
1. **Create Groq Account**
   - Visit [Groq Console](https://console.groq.com)
   - Sign up for an account
   - Verify your email

2. **Generate API Key**
   ```bash
   # Navigate to API Keys section
   # Click "Create API Key"
   # Copy the generated key
   ```

3. **Configure Usage**
   ```env
   # In your .env.local
   GROQ_API_KEY=gsk_your_api_key_here

   # Optional: Set model preference
   GROQ_MODEL=whisper-large-v3

   # Optional: Configure language detection
   GROQ_LANGUAGE=auto  # or specific language code like 'ja', 'zh', 'en'
   ```

#### API Limits and Pricing
- **Free Tier**: Limited requests per day
- **Paid Tier**: $0.006 per minute of audio
- **Rate Limits**: 100 requests per minute
- **Maximum File Size**: 25MB per request

### OpenRouter API Configuration

OpenRouter provides text processing and normalization services.

#### Required Setup
1. **Create OpenRouter Account**
   - Visit [OpenRouter](https://openrouter.ai)
   - Sign up for an account
   - Add credits to your account

2. **Generate API Key**
   ```bash
   # Navigate to Keys section
   # Click "Create new key"
   # Copy the generated key
   ```

3. **Configure Model Selection**
   ```env
   # In your .env.local
   OPENROUTER_API_KEY=sk-or-your_api_key_here
   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

   # Model selection (free options)
   OPENROUTER_MODEL=deepseek/deepseek-chat-v3.1:free
   # OPENROUTER_MODEL=google/gemini-pro
   # OPENROUTER_MODEL=anthropic/claude-2

   # Paid options (better quality)
   # OPENROUTER_MODEL=openai/gpt-4-turbo
   # OPENROUTER_MODEL=anthropic/claude-3-opus
   ```

#### Available Models
| Model | Cost | Quality | Best For |
|-------|------|---------|-----------|
| deepseek/deepseek-chat-v3.1:free | Free | Good | Basic text processing |
| google/gemini-pro | Free | Very Good | Multilingual content |
| openai/gpt-4-turbo | Paid | Excellent | High-quality processing |
| anthropic/claude-3-opus | Paid | Excellent | Complex language tasks |

---

## ⚡ Processing Configuration

### Audio Processing Settings

These settings control how audio files are processed for transcription.

```env
# Chunk Configuration
CHUNK_SECONDS=45           # Length of each audio chunk (seconds)
CHUNK_OVERLAP=0.2          # Overlap between chunks (0-1, ratio)
MAX_CONCURRENCY=3          # Maximum parallel processing

# Quality Settings
AUDIO_SAMPLE_RATE=44100   # Audio sample rate (Hz)
AUDIO_CHANNELS=1          # Mono audio (1) or stereo (2)
AUDIO_BIT_DEPTH=16        # Audio bit depth

# Performance Settings
MAX_FILE_SIZE=100MB       # Maximum upload file size
PROCESSING_TIMEOUT=300000 # Processing timeout (ms)
RETRY_ATTEMPTS=3          # Number of retry attempts
```

### Text Processing Settings

```env
# Language Detection
DETECT_LANGUAGE=true       # Auto-detect audio language
DEFAULT_LANGUAGE=auto      # Fallback language
SUPPORTED_LANGUAGES=ja,zh,en,es,fr,de

# Text Processing
ENABLE_FURIGANA=true       # Add furigana for Japanese
ENABLE_TRANSLATION=true    # Enable translation features
ENABLE_ANNOTATIONS=true    # Add learning annotations

# Output Formatting
SUBTITLE_FORMAT=srt        # Subtitle format (srt, vtt, json)
TIMESTAMP_FORMAT=ms        # Timestamp precision (ms, s)
```

---

## 🎨 UI Configuration

### Display Settings

```typescript
// These are typically configured in the UI components
const uiConfig = {
  theme: 'light', // or 'dark', 'auto'
  language: 'en', // UI language
  fontSize: 'medium', // 'small', 'medium', 'large'
  showWaveform: true,
  autoScroll: true,
  subtitleDelay: 0, // milliseconds
};
```

### Audio Player Configuration

```typescript
const audioPlayerConfig = {
  defaultVolume: 0.8,
  defaultPlaybackRate: 1.0,
  enableABLoop: true,
  defaultLoopDuration: 10, // seconds
  seekStepSize: 5, // seconds
};
```

---

## 🔧 Development Configuration

### Local Development

```env
# Development Environment
NODE_ENV=development
PORT=3000
HOST=localhost

# Development Features
ENABLE_DEV_TOOLS=true
ENABLE_HOT_RELOAD=true
ENABLE_MOCK_APIS=false
ENABLE_DEBUG_LOGGING=true

# Testing
TEST_MODE=false
TEST_DATABASE_NAME=test_shadowing_learning
```

### Production Configuration

```env
# Production Environment
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Security
DISABLE_DEV_TOOLS=true
ENABLE_HTTPS=true
ENABLE_CORS=true
CORS_ORIGIN=https://yourdomain.com

# Performance
ENABLE_COMPRESSION=true
ENABLE_CACHING=true
CACHE_TTL=3600
```

---

## 📊 Configuration Files

### package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "biome check",
    "lint:fix": "biome check --apply",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage"
  }
}
```

### Biome.js Configuration

```json
// biome.json
{
  "linter": {
    "enabled": true,
    "rules": {
      "correctness": {
        "noUnusedVariables": "error"
      },
      "style": {
        "noNonNullAssertion": "warn"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  }
}
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## 🚀 Configuration Profiles

### Development Profile
```env
# .env.development
NODE_ENV=development
ENABLE_DEBUG_LOGGING=true
ENABLE_DEV_TOOLS=true
ENABLE_MOCK_APIS=false
MAX_CONCURRENCY=1  # Reduce for development
```

### Production Profile
```env
# .env.production
NODE_ENV=production
ENABLE_DEBUG_LOGGING=false
ENABLE_DEV_TOOLS=false
ENABLE_ANALYTICS=true
MAX_CONCURRENCY=5   # Increase for production
```

### Testing Profile
```env
# .env.test
NODE_ENV=test
TEST_MODE=true
DB_NAME=test_shadowing_learning
ENABLE_MOCK_APIS=true
```

---

## 🔍 Configuration Validation

The application validates configuration on startup:

```typescript
// Configuration validation example
const validateConfig = () => {
  const required = ['GROQ_API_KEY', 'OPENROUTER_API_KEY'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate numeric values
  const maxConcurrency = parseInt(process.env.MAX_CONCURRENCY || '3');
  if (maxConcurrency < 1 || maxConcurrency > 10) {
    throw new Error('MAX_CONCURRENCY must be between 1 and 10');
  }
};
```

---

## 🛠️ Configuration Management

### Environment-Specific Files

The application loads configuration in this order:

1. `.env` (base configuration)
2. `.env.local` (local overrides)
3. `.env.development` or `.env.production` (environment-specific)
4. Process environment variables

### Best Practices

1. **Security**: Never commit `.env.local` to version control
2. **Documentation**: Document all configuration options
3. **Validation**: Validate configuration on startup
4. **Defaults**: Provide sensible defaults for optional settings
5. **Testing**: Test configuration in different environments

---

## 📚 Next Steps

After configuration:

- [Return to Getting Started](README.md)
- [Read First Steps Guide](first-steps.md)
- [Set Up Development Environment](../development/setup.md)
- [Review API Configuration](../api-reference/README.md)

---

*Configuration issues? Check the [Troubleshooting](../user-guide/troubleshooting.md) section.*