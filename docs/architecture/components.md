# 组件架构详解

## 🧩 组件概览

oumu.ai 的组件架构基于 React 19 和 shadcn/ui，采用模块化设计原则，确保组件的可重用性、可维护性和可测试性。

### 组件分类

```
Component Architecture
├── UI Components (shadcn/ui based)
│   ├── Layout Components
│   ├── Form Components
│   ├── Navigation Components
│   └── Display Components
├── Feature Components
│   ├── Audio Processing
│   ├── File Management
│   ├── Transcription
│   └── Learning Tools
├── Utility Components
│   ├── Error Handling
│   ├── Loading States
│   └── Accessibility
└── Page Components
    ├── Main Application
    ├── Settings
    └── Help
```

## 🎨 UI 组件 (shadcn/ui)

### 基础组件

#### Button 组件
```typescript
// components/ui/button.tsx
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
```

**设计原则**:
- 使用 class-variance-authority 进行变体管理
- 支持 forwardRef 和 asChild 模式
- 完整的可访问性支持
- TypeScript 类型安全

#### Card 组件
```typescript
// components/ui/card.tsx
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
));
```

**特性**:
- 灵活的布局容器
- 统一的边框和阴影样式
- 响应式设计支持

### 表单组件

#### Input 组件
```typescript
// components/ui/input.tsx
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
```

#### Dialog 组件
```typescript
// components/ui/dialog.tsx
const Dialog = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>
>(({ ...props }, ref) => <DialogPrimitive.Root ref={ref} {...props} />);
Dialog.displayName = DialogPrimitive.Root.displayName;

const DialogTrigger = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>
>(({ ...props }, ref) => (
  <DialogPrimitive.Trigger ref={ref} {...props} />
));
DialogTrigger.displayName = DialogPrimitive.Trigger.displayName;
```

## 🎵 功能组件

### AudioPlayer 组件
```typescript
// components/audio-player.tsx
interface AudioPlayerProps {
  audioUrl: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: number) => void;
  playbackRate: number;
  loopStart?: number;
  loopEnd?: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onSeek,
  onSpeedChange,
  playbackRate,
  loopStart,
  loopEnd,
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(duration, percentage * duration));
    
    onSeek(newTime);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onPlayPause}
          className="w-12 h-12"
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </Button>
        
        <div className="flex-1">
          <div
            ref={progressBarRef}
            className="h-2 bg-gray-200 rounded-full cursor-pointer relative"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            {loopStart !== undefined && loopEnd !== undefined && (
              <div
                className="absolute h-full bg-green-300 opacity-50 rounded-full"
                style={{
                  left: `${(loopStart / duration) * 100}%`,
                  width: `${((loopEnd - loopStart) / duration) * 100}%`,
                }}
              />
            )}
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        <PlaybackSpeedControl
          currentSpeed={playbackRate}
          onSpeedChange={onSpeedChange}
        />
      </div>
    </Card>
  );
};
```

**特性**:
- 精确的时间控制和搜索
- A-B 循环可视化
- 播放速度控制
- 实时进度显示
- 响应式设计

### SubtitleDisplay 组件
```typescript
// components/subtitle-display.tsx
interface SubtitleDisplayProps {
  segments: Segment[];
  currentTime: number;
  onWordClick?: (word: string, startTime: number) => void;
  customTerms?: Term[];
}

export const SubtitleDisplay: React.FC<SubtitleDisplayProps> = ({
  segments,
  currentTime,
  onWordClick,
  customTerms,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 5 });

  // 使用二分查找确定当前播放位置
  const getCurrentSegment = useCallback(() => {
    let left = 0;
    let right = segments.length - 1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const segment = segments[mid];
      
      if (currentTime >= segment.start && currentTime <= segment.end) {
        return mid;
      } else if (currentTime < segment.start) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }
    
    return -1;
  }, [segments, currentTime]);

  // 自动滚动到当前字幕
  useEffect(() => {
    const currentIndex = getCurrentSegment();
    if (currentIndex === -1) return;
    
    setVisibleRange({
      start: Math.max(0, currentIndex - 2),
      end: Math.min(segments.length - 1, currentIndex + 2),
    });
  }, [getCurrentSegment, segments.length]);

  const visibleSegments = segments.slice(visibleRange.start, visibleRange.end + 1);

  return (
    <div
      ref={containerRef}
      className="space-y-4 max-h-96 overflow-y-auto"
    >
      {visibleSegments.map((segment, index) => (
        <SegmentCard
          key={segment.id}
          segment={segment}
          isCurrent={currentTime >= segment.start && currentTime <= segment.end}
          onWordClick={onWordClick}
          customTerms={customTerms}
        />
      ))}
    </div>
  );
};
```

**性能优化**:
- 二分查找算法 O(log n) 时间复杂度
- 虚拟滚动处理大量字幕
- 自动滚动和范围管理
- React.memo 优化渲染

### FileUpload 组件
```typescript
// components/file-upload.tsx
interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  acceptedTypes?: string[];
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  acceptedTypes = ['audio/*'],
  maxSize = 100 * 1024 * 1024, // 100MB
  multiple = true,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const handleFiles = useCallback((files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      if (!acceptedTypes.some(type => file.type.match(type))) {
        toast.error(`文件类型不支持: ${file.name}`);
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`文件太大: ${file.name}`);
        return false;
      }
      return true;
    });

    onFilesSelected(validFiles);
  }, [acceptedTypes, maxSize, onFilesSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <Card className={`p-8 border-2 border-dashed transition-colors ${
      isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
    }`}>
      <div
        className="text-center"
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          拖拽音频文件到此处
        </p>
        <p className="text-sm text-gray-600 mb-4">
          或点击选择文件
        </p>
        <input
          type="file"
          accept={acceptedTypes.join(',')}
          multiple={multiple}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
          id="file-upload"
          disabled={disabled}
        />
        <Button asChild disabled={disabled}>
          <label htmlFor="file-upload" className="cursor-pointer">
            选择文件
          </label>
        </Button>
        <p className="text-xs text-gray-500 mt-2">
          支持格式: MP3, WAV, M4A (最大 {maxSize / 1024 / 1024}MB)
        </p>
      </div>
    </Card>
  );
};
```

**用户体验**:
- 拖拽上传支持
- 实时文件验证
- 进度反馈
- 错误处理和提示

## 🔧 工具组件

### ErrorBoundary 组件
```typescript
// components/error-boundary.tsx
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Card className="p-6 border-red-200 bg-red-50">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-red-900 mb-2">
                出现错误
              </h3>
              <p className="text-red-700 mb-4">
                {this.state.error?.message || '应用程序遇到错误'}
              </p>
              <Button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                variant="outline"
              >
                重试
              </Button>
            </div>
          </Card>
        )
      );
    }

    return this.props.children;
  }
}
```

**错误处理**:
- 捕获组件树中的错误
- 提供友好的错误界面
- 错误恢复机制
- 错误日志记录

### LoadingSpinner 组件
```typescript
// components/ui/loading-spinner.tsx
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn('animate-spin rounded-full border-2 border-gray-300 border-t-blue-500', sizeClasses[size])} />
      {text && <span className="ml-2 text-sm text-gray-600">{text}</span>}
    </div>
  );
};
```

## 📱 页面组件

### MainApplication 组件
```typescript
// app/page.tsx
export default function MainApplication() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});

  const handleFilesSelected = useCallback(async (selectedFiles: File[]) => {
    const uploadPromises = selectedFiles.map(async (file, index) => {
      try {
        const fileId = await FileUploadUtils.uploadFile(file);
        
        // Update progress
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
        
        // Start transcription
        TranscriptionService.transcribeAudio(fileId, {
          language: "ja",
          onProgress: (progress) => {
            setUploadProgress(prev => ({ ...prev, [fileId]: progress.progress }));
          },
        });
        
        return fileId;
      } catch (error) {
        console.error('Upload failed:', error);
        throw error;
      }
    });

    const uploadedFiles = await Promise.all(uploadPromises);
    setFiles(prev => [...prev, ...uploadedFiles]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - File Management */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">文件管理</h2>
              <FileUpload onFilesSelected={handleFilesSelected} />
              <FileList
                files={files}
                selectedFiles={selectedFiles}
                onSelect={setSelectedFiles}
                onPlay={(fileId) => {
                  // Handle play
                }}
                onDelete={(fileId) => {
                  setFiles(prev => prev.filter(f => f.id !== fileId));
                }}
              />
            </Card>
          </div>
          
          {/* Right Panel - Audio Player and Subtitles */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              <AudioPlayerSection />
              <SubtitleDisplaySection />
              <TerminologyGlossary />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 🎨 样式和主题

### 主题配置
```typescript
// components/theme-provider.tsx
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark' | 'system';
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ui-theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => 
    (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### 响应式设计
```typescript
// Responsive utilities
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile, isTablet, isDesktop };
};
```

## 🧪 测试策略

### 组件测试示例
```typescript
// components/__tests__/audio-player.test.tsx
describe('AudioPlayer', () => {
  const mockProps = {
    audioUrl: 'test.mp3',
    currentTime: 30,
    duration: 120,
    isPlaying: true,
    onPlayPause: jest.fn(),
    onSeek: jest.fn(),
    onSpeedChange: jest.fn(),
    playbackRate: 1.0,
  };

  it('renders correctly', () => {
    render(<AudioPlayer {...mockProps} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onPlayPause when play/pause button is clicked', () => {
    render(<AudioPlayer {...mockProps} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockProps.onPlayPause).toHaveBeenCalledTimes(1);
  });

  it('seeks to correct position when progress bar is clicked', () => {
    render(<AudioPlayer {...mockProps} />);
    const progressBar = screen.getByRole('progressbar');
    fireEvent.click(progressBar, { clientX: 100 });
    expect(mockProps.onSeek).toHaveBeenCalledWith(25);
  });
});
```

---

*组件架构文档 | 版本: 1.0 | 最后更新: 2024年9月22日*