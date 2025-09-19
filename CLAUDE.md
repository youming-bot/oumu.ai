# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web-based "shadowing learning" application for language practice with audio transcription and text processing using shadcn/ui design system. The application stores all user data locally in IndexedDB and processes audio through Groq Whisper API for transcription and OpenRouter LLMs for text normalization and annotations.

## Current Implementation Status

### ✅ Completed Features (85-90%)
- **Core Architecture**: Next.js 15 + React 19 + TypeScript + shadcn/ui
- **Database Layer**: Dexie (IndexedDB) with migration support (versions 1-4)
- **API Routes**: `/api/transcribe` (Groq), `/api/postprocess` (OpenRouter), `/api/progress`
- **UI Components**: Audio player, subtitle display, file upload with shadcn/ui
- **Error Handling**: Unified error handling framework
- **Custom Hooks**: Modular React hooks for state management (8 hooks)
- **Word-level Timing**: Precise subtitle synchronization with binary search
- **A-B Loop Functionality**: Shadowing practice with sentence-level loops
- **Terminology Management**: Custom glossary with unified translations
- **Security**: XSS protection via DOMPurify, no server-side data persistence

### ⚠️ Known Issues

#### TypeScript Errors (3 critical)
- `file-list.tsx:100,394`: Type safety issues with undefined values and null handling
- `transcription-service.ts:298`: Type mismatch in Segment creation due to unknown type casting

#### Code Quality Issues (153 Biome.js errors)
- **Type Safety**: Multiple non-null assertion warnings and unused variables
- **A11y**: Missing ARIA labels and semantic elements
- **Complexity**: Functions exceeding cognitive complexity limits
- **Style**: Import organization and naming convention violations

#### Test Failures (100+ failed, 243 passing)
- **Audio Processor**: Mock function call verification failures
- **Component Tests**: Missing UI components and React element rendering issues
- **API Tests**: FormData and timeout handling in test environment
- **Infrastructure**: Need proper test environment setup for Web APIs

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
- `Term`: Custom terminology management with readings and examples
- `ProcessingStatus`: Type-safe status tracking for all processing states

### Database Migration History
- **Version 1**: Basic files, transcripts, and segments tables
- **Version 2**: Added updatedAt timestamps for better caching
- **Version 3**: Added terminology management system
- **Version 4**: Added wordTimestamps support to segments table
- **Database**: IndexedDB via Dexie with automatic migration support

## Development Commands

### Development Environment
```bash
# Install dependencies (uses pnpm by default)
npm install
# or
pnpm install

# Development server
npm run dev
# or
pnpm dev

# Build for production
npm run build
# or
pnpm build

# Start production server
npm start
# or
pnpm start
```

### Code Quality
```bash
# Type checking
npm run type-check
# or
pnpm type-check

# Biome.js code quality
npm run lint          # Linting check
npm run format        # Format files
npm run check         # Combined lint and format check
npm run lint:fix      # Auto-fix linting issues
npm run format:fix    # Auto-format code
npm run check:fix     # Combined check with auto-fix

# Biome.js with specific diagnostics
npx biome check --max-diagnostics=200  # Show more errors
npx biome check --write              # Apply all safe fixes
```

### Testing
```bash
# Run all tests
npm test
# or
pnpm test

# Test modes
npm run test:watch    # Watch mode for tests
npm run test:coverage # Coverage report

# Run specific test file
npm test -- --testPathPattern=filename.test.ts
npm test -- --testNamePattern="test name"

# Run tests with verbose output
npm test -- --verbose

# Run tests and watch for changes
npm run test:watch -- filename.test.ts

# Run tests with coverage for specific file
npm test -- --coverage --testPathPattern=filename.test.ts
```

### Scripts and Utilities
```bash
# Run tests via script (CI/diagnostics)
./scripts/run-tests.sh

# Database migration helpers (one-time setup)
./scripts/migrate-to-biome.sh
./scripts/verify-biome-migration.sh

# Quick development setup
npm run type-check && npm run lint && npm test
```

## Environment Configuration

Required environment variables (.env.local):
```env
GROQ_API_KEY=your_groq_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=deepseek/deepseek-chat-v3.1:free
MAX_CONCURRENCY=3
CHUNK_SECONDS=45
CHUNK_OVERLAP=0.2
```

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
  - `useAudioPlayer`: Audio playback controls, A-B looping, timing synchronization
  - `useFiles`: File upload, validation, and storage management
  - `useTranscripts`: Transcription data processing and status tracking
  - `useTranscriptionProgress`: Real-time progress monitoring across multiple chunks
  - `useTerms`: Terminology glossary CRUD operations
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

## UI/UX with shadcn/ui

### Design System
- **Primary UI**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with consistent design tokens
- **Icons**: Lucide React for consistency
- **Theming**: Built-in dark/light mode support

### Key Components
- `AudioPlayer`: Custom audio controls with seek, speed, loop
- `SubtitleDisplay`: Real-time synchronized subtitle rendering
- `FileUpload`: Drag-and-drop with progress indicators
- `FileList`: Card-based file management interface

## File Structure

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
│   ├── subtitle-display.tsx        # Synchronized subtitles
│   ├── waveform-display.tsx        # Audio waveform visualization
│   ├── terminology-glossary.tsx    # Terminology management
│   ├── subtitle-renderer.tsx      # Optimized subtitle rendering
│   ├── word-with-timing.tsx        # Word-level timing display
│   └── terminology-highlighter.tsx # Custom terminology highlighting
├── hooks/                          # Custom React hooks
│   ├── useAppState.ts              # Global application state
│   ├── useAudioPlayer.ts           # Audio playback logic
│   ├── useFiles.ts                 # File management
│   ├── useTranscripts.ts           # Transcription data
│   ├── useTranscriptionProgress.ts # Progress tracking
│   ├── useTerms.ts                 # Terminology management
│   └── useMemoryCleanup.ts         # Memory optimization
├── lib/
│   ├── db.ts                       # Dexie database setup
│   ├── groq-client.ts              # Groq API client
│   ├── openrouter-client.ts        # OpenRouter API client
│   ├── audio-processor.ts          # Audio chunk processing
│   ├── subtitle-sync.ts            # Subtitle synchronization
│   ├── error-handler.ts            # Unified error handling
│   ├── migration-utils.ts          # Database migrations
│   ├── word-timestamp-service.ts   # Word-level timing service
│   ├── waveform-generator.ts      # Audio waveform generation
│   ├── url-manager.ts              # URL state management
│   └── export-service.ts          # Data export functionality
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
- **Biome.js**: Configured with aggressive rules for consistent code style
- **Path Aliases**: Use `@/` for all src imports (configured in tsconfig.json)
- **Component Patterns**: Follow existing shadcn/ui patterns for consistency

### Testing Architecture
- **Unit Tests**: Focus on lib functions and custom hooks (243 passing, 100 failed currently)
- **Component Tests**: React components with Testing Library and mocked dependencies
- **API Tests**: Next.js route handlers with mocked external services (Groq, OpenRouter)
- **Integration Tests**: Critical user workflows with realistic data scenarios
- **Coverage Target**: 80%+ coverage for all critical paths
- **Test Challenges**: Audio/Web APIs require careful mocking in test environment

Test structure:
```
test/
├── unit/components/     # React component tests
├── unit/lib/           # Library function tests
├── unit/hooks/         # Custom hook tests
├── unit/app/api/       # API route tests
└── diagnostic/         # Environment and setup tests
```

### Performance Optimization
- **Binary Search**: O(log n) subtitle synchronization algorithm
- **Efficient IndexedDB**: Proper indexing and query optimization
- **UI Throttling**: 200ms throttling for smooth user experience
- **Memory Management**: Cleanup utilities for large audio files
- **Chunk Processing**: Optimal 45-second chunks for API efficiency

### Package Manager
This project uses **pnpm** as the package manager (configured in package.json) for faster installs and better disk space management.

## Troubleshooting

### Build Issues
- **TypeScript Errors (3 critical)**:
  - `file-list.tsx`: Add null checks for undefined values and return types
  - `transcription-service.ts:298`: Fix unknown type casting with proper type guards
  - Run `npm run type-check` for detailed error information
- **Biome.js Errors (153 errors)**:
  - Run `npx biome check --write` to apply safe fixes automatically
  - Use `npx biome check --max-diagnostics=200` to see all errors
  - Focus on type safety and complexity issues first
- **Environment Setup**: Verify `.env.local` contains all required API keys
- **Dependencies**: Ensure all dependencies are installed with `pnpm install`

### Runtime Issues
- **Browser Console**: Check for detailed error messages and stack traces
- **API Credentials**: Verify Groq and OpenRouter API keys are valid and have credits
- **Network Issues**: Monitor browser network tab for failed API requests
- **IndexedDB Problems**: Clear browser data if database corruption occurs
- **Audio Playback**: Verify audio format compatibility and file integrity

### Testing Issues (100+ failures)
- **Audio Processor Tests**: Mock function verification failures - check mock setup
- **Component Tests**: Missing UI components - verify component exports and imports
- **API Tests**: FormData issues in test environment - use proper FormData mocks
- **Database Tests**: IndexedDB polyfill issues - ensure fake-indexeddb is configured
- **Diagnostic Tests**: Use `./scripts/run-tests.sh` for comprehensive diagnostics

### Specific Error Patterns
- **Non-null assertions**: Replace `!` with optional chaining `?.`
- **Type casting**: Use proper type guards instead of `as unknown`
- **Mock function calls**: Verify mock implementation and call expectations
- **React component rendering**: Check component exports and default imports
- **FormData in tests**: Use proper FormData polyfills for test environment

### Common Fixes
- **Missing Dependencies**: `pnpm install` to restore node_modules
- **TypeScript Cache**: Delete `.next` and `node_modules/.cache` directories
- **Database Issues**: Use browser dev tools to clear IndexedDB data
- **API Rate Limits**: Reduce MAX_CONCURRENCY in environment variables
- **Test Environment**: Use `npx jest --clearCache` to clear Jest cache
- **Biome.js Fixes**: Run `npx biome check --write` for automatic fixes

### Development Workflow Fixes
1. **Type Errors First**: Always fix TypeScript errors before tackling linting
2. **Safe Biome Fixes**: Use `npx biome check --write` for automatic fixes
3. **Test Fixes**: Focus on infrastructure issues before individual test failures
4. **Incremental Progress**: Fix errors in small batches and verify each fix
5. **Test Environment**: Some tests may need environment-specific configurations

## Contributing

### Development Workflow
1. **Branch Strategy**: Create feature branches from main
2. **Code Quality**: Follow TypeScript strict mode and Biome.js formatting
3. **Testing**: Add tests for new functionality (target 80%+ coverage)
4. **Documentation**: Update relevant documentation files
5. **Validation**: Ensure all checks pass: `npm run type-check && npm run lint && npm test`

### Commit Message Format
Follow [Conventional Commits](https://conventionalcommits.org/) specification:
- `feat:` New features and enhancements
- `fix:` Bug fixes and error corrections
- `docs:` Documentation updates and changes
- `style:` Code formatting and style changes
- `refactor:` Code restructuring without functionality changes
- `test:` Test additions and modifications
- `chore:` Maintenance tasks and dependencies

### Code Review Process
- **Self-Review**: Run all quality checks before submitting
- **Description**: Provide clear context and motivation for changes
- **Testing**: Ensure all tests pass and coverage is maintained
- **Documentation**: Update relevant documentation for new features

### Package Manager
This project uses **pnpm** as the package manager for better dependency management and disk space efficiency. When working with this codebase, use `pnpm` commands instead of `npm` for consistency.

### Quick Start Checklist
For new developers working on this codebase:
1. **Environment Setup**: Copy `.env.example` to `.env.local` and add API keys
2. **Install Dependencies**: `pnpm install`
3. **Initial Build**: `pnpm run build` to verify setup
4. **Type Check**: `pnpm run type-check` to catch any TypeScript issues (expect 3 errors)
5. **Code Quality**: Run `npx biome check --write` for automatic fixes (expect 153 errors)
6. **Run Tests**: `pnpm test` to verify test suite (expect 100+ failures currently)
7. **Start Development**: `pnpm run dev` for development server

### Quality Gates Before Committing
- [ ] **TypeScript**: `npm run type-check` passes (or all errors understood)
- [ ] **Biome.js**: `npm run lint` passes with no errors
- [ ] **Tests**: `npm test` passes with no new failures
- [ ] **Build**: `npm run build` completes successfully
- [ ] **Documentation**: Update relevant documentation for new features
- [ ] **API Keys**: Verify no API keys are committed to the repository

### Current Known Limitations
- **Type Safety**: Some legacy code uses `any` types - gradually improve these
- **Test Coverage**: Some tests are flaky due to Web API mocking challenges
- **Error Handling**: Some edge cases may not have comprehensive error handling
- **Performance**: Large audio files may cause memory issues (handled by useMemoryCleanup hook)