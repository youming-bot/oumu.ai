# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web-based "shadowing learning" application for language practice with audio transcription and text processing using shadcn/ui design system.

## Current Implementation Status

### ✅ Completed Features
- **Core Architecture**: Next.js 15 + React 19 + TypeScript + shadcn/ui
- **Database Layer**: Dexie (IndexedDB) with migration support
- **API Routes**: `/api/transcribe` (Groq), `/api/postprocess` (OpenRouter)
- **UI Components**: Audio player, subtitle display, file upload with shadcn/ui
- **Error Handling**: Unified error handling framework
- **Build System**: Successfully building without fatal errors

### ⚠️ Known Issues
- TypeScript warnings (unused variables, any types)
- ESLint deprecation warning (Next.js 16 compatibility)
- Some test variables marked as unused
- Minor code cleanup needed

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

### Data Models (src/types/database.ts)
- `FileRow`: Audio file metadata and blob storage
- `TranscriptRow`: Transcription results with processing status
- `Segment`: Individual sentence segments with timing and annotations

## Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm test
npm run test:watch
npm run test:coverage
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

### Audio Processing
- Chunk-based processing (45s chunks with 0.2s overlap)
- Concurrent processing with MAX_CONCURRENCY control
- Stream-based forwarding to avoid server-side file persistence

### State Management
- IndexedDB for persistent data storage
- React state for UI interactions
- Real-time subtitle synchronization using binary search

### Error Handling
- Zod validation for API requests
- Exponential backoff retry mechanisms
- Comprehensive error states and user feedback
- Unified error handling via lib/error-handler.ts

### Security
- API keys only on server-side routes
- No audio file persistence on server
- CORS protection and input validation

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
│   └── terminology-glossary.tsx    # Terminology management
├── lib/
│   ├── db.ts                       # Dexie database setup
│   ├── groq-client.ts              # Groq API client
│   ├── openrouter-client.ts        # OpenRouter API client
│   ├── audio-processor.ts          # Audio chunk processing
│   ├── subtitle-sync.ts            # Subtitle synchronization
│   ├── error-handler.ts            # Unified error handling
│   └── migration-utils.ts          # Database migrations
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

### Code Quality
- Follow TypeScript strict mode
- Use Zod for runtime validation
- Implement proper error boundaries
- Write tests for core functionality

### Performance
- Optimize audio processing with Web Workers
- Use binary search for subtitle synchronization
- Implement efficient IndexedDB queries
- Throttle UI updates (200ms for smooth UX)

### Testing Strategy
- Unit tests for lib functions
- Component tests for UI elements
- API route testing with mocked dependencies
- E2E tests for critical user flows

## Troubleshooting

### Build Issues
- Run `npm run type-check` to identify TypeScript errors
- Check environment variables are properly set
- Ensure all dependencies are installed

### Runtime Issues
- Check browser console for detailed error messages
- Verify API keys are valid and have sufficient credits
- Monitor network tab for failed API requests

## Contributing

When making changes:
1. Follow existing code patterns and file organization
2. Update relevant documentation
3. Add tests for new functionality
4. Ensure builds pass without errors
5. Follow commit message conventions