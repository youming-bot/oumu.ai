# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web-based "shadowing learning" application for language practice with audio transcription and text processing using shadcn/ui design system. The application stores all user data locally in IndexedDB and processes audio through Groq Whisper API for transcription and OpenRouter LLMs for text normalization and annotations.

## Current Implementation Status

### ✅ Completed Features (85-90%)
- **Core Architecture**: Next.js 15 + React 19 + TypeScript + shadcn/ui
- **Database Layer**: Dexie (IndexedDB) with migration support (versions 1-3)
- **API Routes**: `/api/transcribe` (Groq), `/api/postprocess` (OpenRouter), `/api/progress`
- **UI Components**: Audio player, subtitle display, file upload with shadcn/ui
- **Error Handling**: Unified error handling framework
- **Custom Hooks**: Modular React hooks for state management (6 hooks)
- **Word-level Timing**: Precise subtitle synchronization with binary search
- **Security**: XSS protection via DOMPurify, no server-side data persistence
- **Code Quality**: Biome.js configuration simplified to essential rules

### ⚠️ Known Issues
- **TypeScript Warnings**: Some unused variables and any types remain
- **Test Failures**: Various test failures due to mocking and environment setup
- **Code Cleanup**: Ongoing type definition improvements needed

## Development Commands

### Essential Commands
```bash
# Install dependencies (uses pnpm by default)
pnpm install

# Development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Code Quality (Biome.js)
```bash
# Type checking
pnpm type-check

# Biome.js simplified configuration
pnpm lint          # Linting check
pnpm format        # Format files
pnpm check         # Combined lint and format check

# Biome.js with specific diagnostics
npx biome check --write              # Apply all safe fixes
npx biome check --write --unsafe      # Apply all fixes including unsafe ones
```

### Testing
```bash
# Run all tests
pnpm test

# Test modes
pnpm run test:watch    # Watch mode for tests
pnpm run test:coverage # Coverage report

# Run specific test file
pnpm test -- --testPathPattern=filename.test.ts
pnpm test -- --testNamePattern="test name"

# Run tests with verbose output
pnpm test -- --verbose

# Run specific component tests
pnpm test test/unit/components/file-list.test.tsx
pnpm test test/unit/components/ScrollableSubtitleDisplay.test.tsx
```

### Quick Development Setup
```bash
pnpm type-check && pnpm lint && pnpm test
```

## Environment Configuration

Required environment variables (.env.local):
```env
# Groq API for speech transcription
GROQ_API_KEY=your_groq_api_key

# OpenRouter API for text processing
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=deepseek/deepseek-chat-v3.1:free

# Audio processing configuration
MAX_CONCURRENCY=3
CHUNK_SECONDS=45
CHUNK_OVERLAP=0.2
```

## Core Architecture

### Data Flow
1. **Upload**: Audio files → IndexedDB storage → File metadata
2. **Transcription**: /api/transcribe → Groq Whisper-large-v3 → Raw transcripts
3. **Post-processing**: /api/postprocess → OpenRouter → Normalized segments
4. **Playback**: Audio player + synchronized subtitles + A-B loop functionality

### Key Components
- **Database**: Dexie (IndexedDB) with FileRow, TranscriptRow, Segment interfaces
- **API Routes**: /api/transcribe (Groq), /api/postprocess (OpenRouter), /api/progress
- **UI Components**: shadcn/ui based components for file upload, audio player, subtitle display
- **Processing**: Chunk-based audio processing with overlap and concurrency control
- **Custom Hooks**: React hooks for state management (useAppState, useAudioPlayer, useFiles, useTranscripts, etc.)

### Data Models (src/types/database.ts)
- `FileRow`: Audio file metadata and blob storage
- `TranscriptRow`: Transcription results with processing status
- `Segment`: Individual sentence segments with timing and annotations
- `WordTimestamp`: Word-level timing data for precise synchronization
- `ProcessingStatus`: Type-safe status tracking for all processing states

### Database Migration History
- **Version 1**: Basic files, transcripts, and segments tables
- **Version 2**: Added updatedAt timestamps for better caching
- **Version 3**: Added wordTimestamps support to segments table
- **Database**: IndexedDB via Dexie with automatic migration support

## Implementation Patterns

### Audio Processing Architecture
- **Chunk-based Processing**: 45-second chunks with 0.2s overlap for optimal transcription
- **Concurrent Processing**: MAX_CONCURRENCY control (default: 3) for efficient API usage
- **Stream-based Forwarding**: Audio chunks streamed directly to Groq, no server persistence
- **Overlap Handling**: Intelligent boundary detection to prevent transcription artifacts

### State Management Pattern
- **IndexedDB Persistence**: All user data stored locally using Dexie with proper migration system
- **Custom React Hooks**: Modular state management with clear separation of concerns:
  - `useAppState`: Global application state and UI preferences
  - `useAudioPlayer`: Audio playback controls and timing synchronization
  - `useFiles`: File upload, validation, and storage management
  - `useTranscripts`: Transcription data processing and status tracking
  - `useTranscriptionProgress`: Real-time progress monitoring across multiple chunks
  - `useMemoryCleanup`: Memory optimization and cleanup utilities
- **Subtitle Synchronization**: Binary search algorithm for O(log n) timing precision

### Error Handling Strategy
- **Zod Validation**: Runtime type checking for all API inputs
- **Exponential Backoff**: Retry mechanisms for transient failures
- **Error Boundaries**: React error boundaries for UI component isolation
- **Unified Error Handler**: Centralized error processing via lib/error-handler.ts
- **User Feedback**: Comprehensive error states with actionable messages

### Security Architecture
- **Server-side Only**: API keys never exposed to client-side code
- **No Persistence**: Audio files processed through streams, never stored on server
- **Input Sanitization**: XSS protection via DOMPurify for all user-generated content
- **CORS Protection**: Proper cross-origin request handling
- **IndexedDB Security**: Client-side data isolation

## Testing Configuration

### Jest Configuration
- **Setup**: jest.setup.js provides comprehensive Web API mocking
- **Environment**: jest-environment-jsdom with fake-indexeddb
- **Timeout**: 15 seconds for API-related tests
- **Path Aliases**: `@/*` mapped to `src/*`
- **Coverage**: Excludes API routes and type definitions

### Mock Setup
- **IndexedDB**: fake-indexeddb for database testing
- **FormData**: Custom FormData implementation for file upload tests
- **Blob/File**: Mock implementations for audio file handling
- **Web APIs**: ResizeObserver, DataTransfer, URL API mocking

### Test Structure
```
test/
├── unit/components/     # React component tests
├── unit/lib/           # Library function tests
├── unit/hooks/         # Custom hook tests
├── unit/app/api/       # API route tests
├── integration/        # Integration tests
└── diagnostic/         # Environment and setup tests
```

## UI/UX with shadcn/ui

### Design System
- **Primary UI**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with consistent design tokens
- **Icons**: Lucide React for consistency
- **Theming**: Built-in dark/light mode support

### Key Components
- `AudioPlayer`: Custom audio controls with seek, speed
- `SubtitleDisplay`: Real-time synchronized subtitle rendering
- `FileUpload`: Drag-and-drop with progress indicators
- `FileList`: Card-based file management interface
- `FileCard`: Individual file management with redesigned icons
- `ScrollableSubtitleDisplay`: Scrollable subtitle container with timing sync

## Biome.js Configuration

### Current Configuration (Simplified)
- **Format**: 2-space indentation, 100 character line width
- **Lint Rules**: Recommended rules + essential custom rules
- **Test Files**: Special handling for test files (allows `any` types)
- **CSS**: Unknown at-rules disabled for Tailwind compatibility
- **Accessibility**: Some rules disabled for component flexibility

## File Structure Highlights

```
src/
├── app/
│   ├── api/transcribe/route.ts     # Groq transcription endpoint
│   ├── api/postprocess/route.ts    # OpenRouter processing endpoint
│   ├── api/progress/[fileId]/route.ts # Progress tracking
│   ├── layout.tsx                  # Root layout with providers
│   ├── page.tsx                    # Main application page
│   └── globals.css                 # Global styles with shadcn/ui
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── audio-player.tsx            # Audio playback controls
│   ├── file-upload.tsx             # File upload interface
│   ├── file-list.tsx               # File management
│   ├── file-card.tsx               # Individual file card
│   ├── subtitle-display.tsx        # Synchronized subtitles
│   ├── ScrollableSubtitleDisplay.tsx # Enhanced subtitle component
│   └── player/                     # Player-related components
├── hooks/                          # Custom React hooks
│   ├── useAppState.ts              # Global application state
│   ├── useAudioPlayer.ts           # Audio playback logic
│   ├── useFiles.ts                 # File management
│   ├── useTranscripts.ts           # Transcription data
│   └── usePlayerDrawer.ts          # Player drawer functionality
├── lib/
│   ├── db.ts                       # Dexie database setup
│   ├── groq-client.ts              # Groq API client
│   ├── openrouter-client.ts        # OpenRouter API client
│   ├── audio-processor.ts          # Audio chunk processing
│   ├── error-handler.ts            # Unified error handling
│   └── utils.ts                    # Utility functions
└── types/
    ├── database.ts                 # TypeScript interfaces
    └── errors.ts                   # Error type definitions
```

## API Contracts

### POST /api/transcribe
```typescript
// Query params: fileId, chunkIndex?, offsetSec?
// Body: FormData with audio blob and meta JSON
{
  fileId: string,
  language?: string,      // default: auto-detect
  chunkSeconds?: number,  // default: 45
  overlap?: number        // default: 0.2
}
```

### POST /api/postprocess
```typescript
{
  fileId: string,
  segments: RawSegment[],
  targetLanguage?: string,    // default: 'zh'
  enableAnnotations?: boolean,// default: true
  enableFurigana?: boolean,   // default: true
  enableTerminology?: boolean // default: true
}
```

## Development Guidelines

### Code Quality Standards
- **TypeScript Strict Mode**: No `any` types except in test files
- **Zod Validation**: Runtime type checking for all API inputs and outputs
- **Error Boundaries**: Implement for all React components that handle external data
- **Biome.js**: Simplified configuration focusing on essential rules
- **Path Aliases**: Use `@/` for all src imports (configured in tsconfig.json)
- **Component Patterns**: Follow existing shadcn/ui patterns for consistency

### Performance Optimization
- **Binary Search**: O(log n) subtitle synchronization algorithm
- **Efficient IndexedDB**: Proper indexing and query optimization
- **UI Throttling**: 200ms throttling for smooth user experience
- **Memory Management**: Cleanup utilities for large audio files
- **Chunk Processing**: Optimal 45-second chunks for API efficiency

### Package Manager
This project uses **pnpm** as the package manager (configured in package.json) for faster installs and better disk space management.

## Common Issues and Solutions

### Build Issues
- **TypeScript Errors**: Most critical errors have been resolved
- **Biome.js Errors**: Run `pnpm biome check --write --unsafe` for automatic fixes
- **Environment Setup**: Verify `.env.local` contains all required API keys
- **Dependencies**: Ensure all dependencies are installed with `pnpm install`

### Testing Issues
- **Mock Issues**: Jest setup includes comprehensive Web API mocking
- **FormData Tests**: Custom FormData implementation in jest.setup.js
- **Environment Issues**: Use diagnostic tests to verify setup
- **Core Components**: FileList tests pass (29/29) - use as reference

### Development Workflow Fixes
1. **Type Errors First**: Always fix TypeScript errors before tackling linting
2. **Safe Biome Fixes**: Use `pnpm biome check --write` for automatic fixes
3. **Test Fixes**: Focus on infrastructure issues before individual test failures
4. **Incremental Progress**: Fix errors in small batches and verify each fix

## Quality Gates Before Committing
- [ ] **TypeScript**: `pnpm type-check` passes
- [ ] **Biome.js**: `pnpm lint` passes with minimal errors
- [ ] **Tests**: `pnpm test` passes with no new failures
- [ ] **Build**: `pnpm build` completes successfully
- [ ] **Documentation**: Update relevant documentation for new features
- [ ] **API Keys**: Verify no API keys are committed to the repository