# Coding Standards

This document outlines the coding standards and conventions used in the Shadowing Learning project.

## 🎯 Philosophy

- **Consistency**: Maintain consistent code style across the project
- **Readability**: Write code that is easy to understand
- **Maintainability**: Structure code for long-term maintenance
- **Type Safety**: Leverage TypeScript for robust type checking

## 📝 TypeScript Standards

### Type Safety
```typescript
// ✅ Good - Strict typing
interface UserData {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

function getUser(id: string): Promise<UserData | null> {
  // Implementation
}

// ❌ Avoid - Any types
function getUser(id: any): any {
  // Implementation
}
```

### Interface vs Type
```typescript
// ✅ Use interfaces for objects
interface User {
  id: string;
  name: string;
}

// ✅ Use types for unions, primitives, or complex types
type UserId = string;
type Status = 'pending' | 'processing' | 'completed' | 'failed';
```

### Error Handling
```typescript
// ✅ Good - Specific error types
class TranscriptionError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'TranscriptionError';
  }
}

// ✅ Good - Result pattern
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

async function transcribeAudio(file: File): Promise<Result<Transcript>> {
  try {
    const transcript = await performTranscription(file);
    return { success: true, data: transcript };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

## 🎨 React Standards

### Component Patterns
```typescript
// ✅ Good - Function component with TypeScript
interface AudioPlayerProps {
  src: string;
  onTimeUpdate?: (currentTime: number) => void;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  onTimeUpdate,
  className = '',
}) => {
  // Implementation
};
```

### Hooks
```typescript
// ✅ Good - Custom hook with proper typing
interface UseAudioPlayerOptions {
  autoPlay?: boolean;
  loop?: boolean;
}

interface UseAudioPlayerReturn {
  play: () => void;
  pause: () => void;
  currentTime: number;
  duration: number;
}

export function useAudioPlayer(
  src: string,
  options: UseAudioPlayerOptions = {}
): UseAudioPlayerReturn {
  // Implementation
}
```

### State Management
```typescript
// ✅ Good - Use appropriate state management
function Component() {
  // Local state
  const [count, setCount] = useState(0);

  // Complex state with reducer
  const [state, dispatch] = useReducer(audioReducer, initialState);

  // Derived state
  const doubledCount = useMemo(() => count * 2, [count]);

  // Side effects
  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);
}
```

## 🏗️ File Organization

### Naming Conventions
```typescript
// Files: kebab-case
// components/audio-player.tsx
// hooks/use-audio-player.ts
// lib/audio-processor.ts

// Directories: kebab-case
// components/ui/
// hooks/
// lib/utils/

// Components: PascalCase
// AudioPlayer, SubtitleDisplay, FileUpload

// Functions: camelCase
// transcribeAudio, processSegments, formatTime

// Constants: UPPER_SNAKE_CASE
// MAX_CONCURRENCY, CHUNK_SECONDS, API_TIMEOUT

// Types/Interfaces: PascalCase
// UserData, TranscriptSegment, ProcessingStatus
```

### Import Organization
```typescript
// ✅ Good - Organized imports
// External dependencies
import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';

// Internal dependencies
import { useAudioPlayer } from '@/hooks/use-audio-player';
import { AudioPlayer } from '@/components/audio-player';
import { formatTime } from '@/lib/utils';

// Types
import type { AudioPlayerProps } from '@/components/audio-player';
```

## 🧪 Testing Standards

### Test Structure
```typescript
// ✅ Good - Test organization
describe('AudioPlayer', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  describe('playback', () => {
    it('should play audio when play button is clicked', () => {
      // Test implementation
    });

    it('should pause audio when pause button is clicked', () => {
      // Test implementation
    });
  });
});
```

### Mocking
```typescript
// ✅ Good - Proper mocking
jest.mock('@/lib/groq-client');
const mockGroqClient = GroqClient as jest.Mocked<typeof GroqClient>;

beforeEach(() => {
  mockGroqClient.transcribe.mockResolvedValue(mockTranscript);
});
```

## 🎨 Styling Standards

### CSS/StyleSheet
```typescript
// ✅ Good - Consistent styling
const styles = clsx(
  'base-styles',
  isActive && 'active-styles',
  className
);

// ✅ Good - Tailwind utility classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  {/* Content */}
</div>
```

### Theme Usage
```typescript
// ✅ Good - Theme-aware components
import { useTheme } from 'next-themes';

function ThemedComponent() {
  const { theme, setTheme } = useTheme();

  return (
    <div className={theme === 'dark' ? 'dark-styles' : 'light-styles'}>
      {/* Content */}
    </div>
  );
}
```

## 🔧 Performance Standards

### Optimization Patterns
```typescript
// ✅ Good - Memoization
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// ✅ Good - Callback optimization
const handleClick = useCallback(() => {
  onEvent(data.id);
}, [onEvent, data.id]);

// ✅ Good - Component optimization
const ExpensiveComponent = React.memo(({ data }) => {
  // Component implementation
});
```

### Code Splitting
```typescript
// ✅ Good - Dynamic imports
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </React.Suspense>
  );
}
```

## 📊 Documentation Standards

### Code Comments
```typescript
// ✅ Good - JSDoc comments
/**
 * Processes audio file for transcription
 * @param file - Audio file to process
 * @param options - Processing options
 * @returns Promise resolving to transcript data
 * @throws TranscriptionError if processing fails
 */
async function processAudio(
  file: File,
  options: ProcessingOptions = {}
): Promise<TranscriptData> {
  // Implementation
}
```

### README Standards
```markdown
# Component Name

Brief description of the component.

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| src | string | Yes | - | Audio source URL |
| onPlay | function | No | - | Callback when playback starts |

## Examples

```tsx
<AudioPlayer
  src="/audio.mp3"
  onPlay={() => console.log('Playing')}
/>
```

## Accessibility

- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
```

## 🛡️ Security Standards

### Input Validation
```typescript
// ✅ Good - Zod validation
import { z } from 'zod';

const TranscriptionRequestSchema = z.object({
  fileId: z.string().uuid(),
  language: z.string().optional(),
  chunkSeconds: z.number().min(1).max(300).optional(),
});

function validateTranscriptionRequest(data: unknown) {
  return TranscriptionRequestSchema.parse(data);
}
```

### XSS Prevention
```typescript
// ✅ Good - Input sanitization
import DOMPurify from 'dompurify';

function sanitizeUserInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em'],
    ALLOWED_ATTR: []
  });
}
```

## 🚀 Build and Deployment

### Environment Configuration
```typescript
// ✅ Good - Environment validation
const envSchema = z.object({
  GROQ_API_KEY: z.string().min(1),
  OPENROUTER_API_KEY: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

const env = envSchema.parse(process.env);
```

### Error Boundaries
```typescript
// ✅ Good - Error boundaries
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh.</div>;
    }

    return this.props.children;
  }
}
```

---

*These standards ensure code quality and maintainability. Follow them consistently across all contributions.*