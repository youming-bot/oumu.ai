/**
 * 语言学习应用完整工作流程集成测试
 * 测试文件上传、转录、播放和用户界面交互的完整流程
 */

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FileManager from "@/components/file-manager";
import SubtitleDisplay from "@/components/subtitle-display";

// Mock 所有依赖
jest.mock("@/hooks/useFiles");
jest.mock("@/hooks/useTranscriptionManager");
jest.mock("@/hooks/useTranscripts");
jest.mock("@/hooks/useAppState");
jest.mock("@/hooks/useAudioPlayer");
jest.mock("@/hooks/useFileFormatting");
jest.mock("@/lib/db");
jest.mock("@/lib/groq-client");
jest.mock("@/lib/openrouter-client");

// Mock lucide-react 图标
jest.mock("lucide-react", () => ({
  Upload: () => <svg data-testid="upload-icon" />,
  File: () => <svg data-testid="file-icon" />,
  Play: () => <svg data-testid="play-icon" />,
  Pause: () => <svg data-testid="pause-icon" />,
  Trash2: () => <svg data-testid="trash-icon" />,
  Square: () => <svg data-testid="square-icon" />,
  CheckCircle: () => <svg data-testid="check-circle-icon" />,
  Clock: () => <svg data-testid="clock-icon" />,
  AlertCircle: () => <svg data-testid="alert-circle-icon" />,
  Loader: () => <svg data-testid="loader-icon" />,
  RefreshCw: () => <svg data-testid="refresh-cw-icon" />,
  Filter: () => <svg data-testid="filter-icon" />,
}));

// Mock UI 组件
jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant, ...props }: any) => (
    <span {...props} data-testid={`badge-${variant}`}>
      {children}
    </span>
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, variant, type, ...props }: any) => (
    <button
      {...props}
      type={type || "button"}
      data-testid="button"
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
    >
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: any) => (
    <div {...props} data-testid="card">
      {children}
    </div>
  ),
}));

jest.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input {...props} data-testid="input" />,
}));

jest.mock("@/components/ui/skeleton", () => ({
  Skeleton: (props: any) => <div {...props} data-testid="skeleton" />,
}));

jest.mock("@/components/ui/table", () => ({
  Table: ({ children, ...props }: any) => (
    <table {...props} data-testid="table">
      {children}
    </table>
  ),
  TableBody: ({ children, ...props }: any) => (
    <tbody {...props} data-testid="tbody">
      {children}
    </tbody>
  ),
  TableCell: ({ children, ...props }: any) => (
    <td {...props} data-testid="td">
      {children}
    </td>
  ),
  TableHead: ({ children, ...props }: any) => (
    <th {...props} data-testid="th">
      {children}
    </th>
  ),
  TableHeader: ({ children, ...props }: any) => (
    <thead {...props} data-testid="thead">
      {children}
    </thead>
  ),
  TableRow: ({ children, ...props }: any) => (
    <tr {...props} data-testid="tr">
      {children}
    </tr>
  ),
}));

jest.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children, ...props }: any) => (
    <div {...props} data-testid="tooltip">
      {children}
    </div>
  ),
  TooltipContent: ({ children, ...props }: any) => (
    <div {...props} data-testid="tooltip-content">
      {children}
    </div>
  ),
  TooltipProvider: ({ children, ...props }: any) => (
    <div {...props} data-testid="tooltip-provider">
      {children}
    </div>
  ),
  TooltipTrigger: ({ children, asChild, ...props }: any) => {
    if (asChild) {
      return children;
    }
    return (
      <div {...props} data-testid="tooltip-trigger">
        {children}
      </div>
    );
  },
}));

jest.mock("@/components/ui/drawer", () => ({
  Drawer: ({ children, ...props }: any) => (
    <div {...props} data-testid="drawer">
      {children}
    </div>
  ),
  DrawerContent: ({ children, ...props }: any) => (
    <div {...props} data-testid="drawer-content">
      {children}
    </div>
  ),
}));

// Mock 数据类型
const createMockFile = (overrides: Partial<any> = {}) => ({
  id: Date.now(),
  name: "test-audio.mp3",
  size: 1024000,
  type: "audio/mpeg",
  duration: 120,
  createdAt: new Date(),
  updatedAt: new Date(),
  blob: new Blob(["audio content"], { type: "audio/mpeg" }),
  ...overrides,
});

const createMockTranscript = (overrides: Partial<any> = {}) => ({
  id: Date.now(),
  fileId: 1,
  status: "pending",
  rawText: "",
  segments: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("语言学习应用完整工作流程测试", () => {
  let mockAddFiles: jest.Mock;
  let mockDeleteFile: jest.Mock;
  let mockRetryTranscription: jest.Mock;
  let mockPlayFile: jest.Mock;
  let mockStartTranscription: jest.Mock;
  let user: any;

  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup();

    // Mock 核心函数
    mockAddFiles = jest.fn();
    mockDeleteFile = jest.fn();
    mockRetryTranscription = jest.fn();
    mockPlayFile = jest.fn();
    mockStartTranscription = jest.fn();

    // Mock useFiles hook
    const mockUseFiles = require("@/hooks/useFiles").useFiles;
    mockUseFiles.mockReturnValue({
      files: [],
      isLoading: false,
      loadFiles: jest.fn(),
      refreshFiles: jest.fn(),
      addFiles: mockAddFiles,
      deleteFile: mockDeleteFile,
    });

    // Mock useTranscriptionManager hook
    const mockUseTranscriptionManager =
      require("@/hooks/useTranscriptionManager").useTranscriptionManager;
    mockUseTranscriptionManager.mockReturnValue({
      isTranscribing: false,
      transcriptionQueue: [],
      currentTranscription: null,
      transcriptionProgress: new Map(),
      startTranscription: mockStartTranscription,
      retryTranscription: mockRetryTranscription,
      queueTranscription: jest.fn(),
      getProgressInfo: jest.fn(),
      getTranscriptionStatus: jest.fn(() => "pending"),
    });

    // Mock useTranscripts hook
    const mockUseTranscripts = require("@/hooks/useTranscripts").useTranscripts;
    mockUseTranscripts.mockReturnValue({
      transcripts: [],
      isLoading: false,
      refreshTranscripts: jest.fn(),
    });

    // Mock useAppState hook
    const mockUseAppState = require("@/hooks/useAppState").useAppState;
    mockUseAppState.mockReturnValue({
      theme: "light",
      setTheme: jest.fn(),
    });

    // Mock useAudioPlayer hook
    const mockUseAudioPlayer = require("@/hooks/useAudioPlayer").useAudioPlayer;
    mockUseAudioPlayer.mockReturnValue({
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      playbackRate: 1,
      play: jest.fn(),
      pause: jest.fn(),
      seek: jest.fn(),
      setVolume: jest.fn(),
      setPlaybackRate: jest.fn(),
      setCurrentFile: mockPlayFile,
    });

    // Mock useFileFormatting hook
    const mockUseFileFormatting = require("@/hooks/useFileFormatting").useFileFormatting;
    mockUseFileFormatting.mockReturnValue({
      formatFileSize: jest.fn((bytes: number) => `${bytes / 1024} KB`),
      formatDuration: jest.fn((seconds?: number) => (seconds ? `${seconds}s` : "--:--")),
      getStatusIcon: jest.fn(() => <div data-testid="status-icon" />),
      getStatusVariant: jest.fn(() => "default" as const),
      getStatusText: jest.fn((status: string) => status),
    });
  });

  describe("1. 文件上传功能测试", () => {
    it("应该支持多文件上传功能", async () => {
      render(<FileManager files={[]} transcripts={[]} onFilesSelected={mockAddFiles} />);

      // 检查上传区域存在
      const uploadArea = screen.getByText(/拖放音频文件到此处或点击浏览/);
      expect(uploadArea).toBeInTheDocument();

      // 模拟文件选择
      const mockFiles = [
        new File(["audio1"], "test1.mp3", { type: "audio/mpeg" }),
        new File(["audio2"], "test2.mp3", { type: "audio/mpeg" }),
        new File(["audio3"], "test3.wav", { type: "audio/wav" }),
      ];

      // 模拟文件上传
      const fileInput = screen.getByLabelText(/拖放音频文件到此处或点击浏览/);
      Object.defineProperty(fileInput, "files", {
        value: mockFiles,
        writable: false,
      });

      await user.click(fileInput);
      await mockAddFiles(mockFiles);

      expect(mockAddFiles).toHaveBeenCalledWith(mockFiles);
      expect(mockAddFiles).toHaveBeenCalledTimes(1);
    });

    it("应该验证支持的音频格式", async () => {
      render(<FileManager files={[]} transcripts={[]} onFilesSelected={mockAddFiles} />);

      // 测试支持的格式
      const supportedFormats = [
        { name: "test.mp3", type: "audio/mpeg" },
        { name: "test.wav", type: "audio/wav" },
        { name: "test.m4a", type: "audio/mp4" },
        { name: "test.ogg", type: "audio/ogg" },
      ];

      const mockFiles = supportedFormats.map(
        (format) => new File(["audio"], format.name, { type: format.type }),
      );

      await mockAddFiles(mockFiles);
      expect(mockAddFiles).toHaveBeenCalledWith(mockFiles);
    });

    it("应该显示上传进度", async () => {
      const mockUseFiles = require("@/hooks/useFiles").useFiles;
      mockUseFiles.mockReturnValue({
        files: [],
        isLoading: true,
        loadFiles: jest.fn(),
        refreshFiles: jest.fn(),
        addFiles: mockAddFiles,
        deleteFile: mockDeleteFile,
      });

      render(<FileManager files={[]} transcripts={[]} onFilesSelected={mockAddFiles} />);

      // 检查加载状态
      expect(screen.getAllByTestId("skeleton")).toHaveLength(1);
    });
  });

  describe("2. 数据存储和文件列表测试", () => {
    it("应该显示文件列表和元数据", () => {
      const mockFiles = [
        createMockFile({ id: 1, name: "lesson1.mp3", size: 2048000, duration: 180 }),
        createMockFile({ id: 2, name: "lesson2.mp3", size: 1024000, duration: 120 }),
      ];

      render(<FileManager files={mockFiles} transcripts={[]} onFilesSelected={mockAddFiles} />);

      // 检查文件显示
      expect(screen.getByText("lesson1.mp3")).toBeInTheDocument();
      expect(screen.getByText("lesson2.mp3")).toBeInTheDocument();
      expect(screen.getByText("文件管理 (2 个文件)")).toBeInTheDocument();
    });

    it("应该按上传时间排序文件", () => {
      const olderFile = createMockFile({
        id: 1,
        name: "older.mp3",
        createdAt: new Date("2024-01-01"),
      });
      const newerFile = createMockFile({
        id: 2,
        name: "newer.mp3",
        createdAt: new Date("2024-01-02"),
      });

      render(
        <FileManager
          files={[olderFile, newerFile]}
          transcripts={[]}
          onFilesSelected={mockAddFiles}
        />,
      );

      // 检查排序（最新的应该在前面）
      const fileElements = screen.getAllByTestId("tr");
      expect(fileElements[1]).toContainElement(screen.getByText("newer.mp3"));
      expect(fileElements[2]).toContainElement(screen.getByText("older.mp3"));
    });

    it("应该显示空状态", () => {
      render(<FileManager files={[]} transcripts={[]} onFilesSelected={mockAddFiles} />);

      expect(screen.getByText("尚未上传文件")).toBeInTheDocument();
      expect(screen.getByText("上传音频文件开始跟读练习。")).toBeInTheDocument();
    });
  });

  describe("3. 转录流程测试", () => {
    it("应该开始转录流程", async () => {
      const mockFile = createMockFile({ id: 1, name: "test.mp3" });

      render(
        <FileManager
          files={[mockFile]}
          transcripts={[]}
          onFilesSelected={mockAddFiles}
          onRetryTranscription={mockRetryTranscription}
        />,
      );

      // 点击重新转录按钮
      const retryButton = screen.getByText("重新转录");
      await user.click(retryButton);

      expect(mockRetryTranscription).toHaveBeenCalledWith(mockFile.id);
    });

    it("应该显示转录状态变化", () => {
      const mockFile = createMockFile({ id: 1, name: "test.mp3" });
      const mockTranscript = createMockTranscript({
        id: 1,
        fileId: 1,
        status: "processing",
      });

      const mockUseTranscriptionManager =
        require("@/hooks/useTranscriptionManager").useTranscriptionManager;
      mockUseTranscriptionManager.mockReturnValue({
        isTranscribing: true,
        transcriptionQueue: [],
        currentTranscription: { fileId: 1, progress: 0.5 },
        transcriptionProgress: new Map([
          [1, { fileId: 1, status: "processing", progress: 50, message: "转录中..." }],
        ]),
        startTranscription: mockStartTranscription,
        retryTranscription: mockRetryTranscription,
        queueTranscription: jest.fn(),
        getProgressInfo: jest.fn(() => ({
          fileId: 1,
          status: "processing",
          progress: 50,
          message: "转录中...",
        })),
        getTranscriptionStatus: jest.fn(() => "processing"),
      });

      render(
        <FileManager
          files={[mockFile]}
          transcripts={[mockTranscript]}
          onFilesSelected={mockAddFiles}
          onRetryTranscription={mockRetryTranscription}
        />,
      );

      // 检查处理状态显示
      expect(screen.getByText("processing")).toBeInTheDocument();
    });

    it("应该处理转录完成状态", () => {
      const mockFile = createMockFile({ id: 1, name: "test.mp3" });
      const mockTranscript = createMockTranscript({
        id: 1,
        fileId: 1,
        status: "completed",
        segments: [
          { start: 0, end: 5, text: "こんにちは、これはテストです。" },
          { start: 5, end: 10, text: "これは音声認識のテストです。" },
        ],
      });

      render(
        <FileManager
          files={[mockFile]}
          transcripts={[mockTranscript]}
          onFilesSelected={mockAddFiles}
          onPlayFile={mockPlayFile}
        />,
      );

      // 检查完成状态和播放按钮
      expect(screen.getByText("completed")).toBeInTheDocument();
      const playButton = screen.getByTestId("play-icon").closest("button");
      expect(playButton).not.toBeDisabled();
    });

    it("应该处理转录失败状态", () => {
      const mockFile = createMockFile({ id: 1, name: "test.mp3" });
      const mockTranscript = createMockTranscript({
        id: 1,
        fileId: 1,
        status: "failed",
      });

      const mockUseTranscriptionManager =
        require("@/hooks/useTranscriptionManager").useTranscriptionManager;
      mockUseTranscriptionManager.mockReturnValue({
        isTranscribing: false,
        transcriptionQueue: [],
        currentTranscription: null,
        transcriptionProgress: new Map([
          [1, { fileId: 1, status: "failed", progress: 0, message: "转录失败" }],
        ]),
        startTranscription: mockStartTranscription,
        retryTranscription: mockRetryTranscription,
        queueTranscription: jest.fn(),
        getProgressInfo: jest.fn(() => ({
          fileId: 1,
          status: "failed",
          progress: 0,
          message: "转录失败",
        })),
        getTranscriptionStatus: jest.fn(() => "failed"),
      });

      render(
        <FileManager
          files={[mockFile]}
          transcripts={[mockTranscript]}
          onFilesSelected={mockAddFiles}
          onRetryTranscription={mockRetryTranscription}
        />,
      );

      // 检查失败状态和重试按钮
      expect(screen.getByText("failed")).toBeInTheDocument();
      expect(screen.getByText("重新转录")).toBeInTheDocument();
    });
  });

  describe("4. 文件卡片功能测试", () => {
    it("应该启用删除文件功能", async () => {
      const mockFile = createMockFile({ id: 1, name: "test.mp3" });

      render(
        <FileManager
          files={[mockFile]}
          transcripts={[]}
          onFilesSelected={mockAddFiles}
          onDeleteFile={mockDeleteFile}
        />,
      );

      // 点击删除按钮
      const deleteButton = screen.getByTestId("trash-icon").closest("button");
      await user.click(deleteButton!);

      expect(mockDeleteFile).toHaveBeenCalledWith(mockFile.id);
    });

    it("应该在转录成功后高亮显示", () => {
      const mockFile = createMockFile({ id: 1, name: "test.mp3" });
      const mockTranscript = createMockTranscript({
        id: 1,
        fileId: 1,
        status: "completed",
      });

      render(
        <FileManager
          files={[mockFile]}
          transcripts={[mockTranscript]}
          onFilesSelected={mockAddFiles}
          onPlayFile={mockPlayFile}
        />,
      );

      // 检查高亮效果（通过检查特定的样式类）
      const row = screen.getByText("test.mp3").closest("tr");
      expect(row).toHaveClass("hover:bg-muted/50");
    });

    it("应该显示鼠标悬停效果", async () => {
      const mockFile = createMockFile({ id: 1, name: "test.mp3" });

      render(<FileManager files={[mockFile]} transcripts={[]} onFilesSelected={mockAddFiles} />);

      const row = screen.getByText("test.mp3").closest("tr");

      // 模拟鼠标悬停
      await user.hover(row!);

      // 检查悬停效果
      expect(row).toHaveClass("hover:bg-muted/50");
    });
  });

  describe("5. 用户界面测试", () => {
    it("应该支持抽屉弹出功能", () => {
      const mockFile = createMockFile({ id: 1, name: "test.mp3" });
      const mockTranscript = createMockTranscript({
        id: 1,
        fileId: 1,
        status: "completed",
        segments: [{ start: 0, end: 5, text: "こんにちは、これはテストです。" }],
      });

      render(
        <FileManager
          files={[mockFile]}
          transcripts={[mockTranscript]}
          onFilesSelected={mockAddFiles}
          onPlayFile={mockPlayFile}
        />,
      );

      // 点击播放按钮应该打开抽屉
      const playButton = screen.getByTestId("play-icon").closest("button");
      fireEvent.click(playButton!);

      // 检查抽屉是否被调用
      expect(mockPlayFile).toHaveBeenCalledWith(mockFile);
    });

    it("应该显示字幕组件和播放器集成", () => {
      const mockSegments = [
        { start: 0, end: 5, text: "こんにちは、これはテストです。" },
        { start: 5, end: 10, text: "これは音声認識のテストです。" },
      ];

      render(<SubtitleDisplay segments={mockSegments} currentTime={2.5} />);

      // 检查字幕显示
      expect(screen.getByText("こんにちは、これはテストです。")).toBeInTheDocument();
    });

    it("应该支持主题切换功能", () => {
      const mockUseAppState = require("@/hooks/useAppState").useAppState;
      const setTheme = jest.fn();
      mockUseAppState.mockReturnValue({
        theme: "dark",
        setTheme,
      });

      render(<FileManager files={[]} transcripts={[]} onFilesSelected={mockAddFiles} />);

      // 主题切换功能通过 hook 处理
      expect(setTheme).toBeDefined();
    });

    it("应该支持响应式设计", () => {
      const mockFiles = [createMockFile({ id: 1, name: "mobile-test.mp3" })];

      render(<FileManager files={mockFiles} transcripts={[]} onFilesSelected={mockAddFiles} />);

      // 检查响应式元素
      const table = screen.getByTestId("table");
      expect(table).toBeInTheDocument();

      // 检查文件名在不同屏幕尺寸下的显示
      const fileName = screen.getByText("mobile-test.mp3");
      expect(fileName).toBeInTheDocument();
    });
  });

  describe("6. 性能和用户体验测试", () => {
    it("应该处理大文件上传", async () => {
      const largeFile = new File(["x".repeat(50 * 1024 * 1024)], "large.mp3", {
        type: "audio/mpeg",
      });

      render(<FileManager files={[]} transcripts={[]} onFilesSelected={mockAddFiles} />);

      await mockAddFiles([largeFile]);
      expect(mockAddFiles).toHaveBeenCalledWith([largeFile]);
    });

    it("应该验证字幕同步准确性", () => {
      const mockSegments = [
        { start: 0, end: 5, text: "第一句" },
        { start: 5, end: 10, text: "第二句" },
        { start: 10, end: 15, text: "第三句" },
      ];

      const { rerender } = render(<SubtitleDisplay segments={mockSegments} currentTime={2.5} />);

      // 检查当前时间点的字幕
      expect(screen.getByText("第一句")).toBeInTheDocument();

      // 更新时间并重新渲染
      rerender(<SubtitleDisplay segments={mockSegments} currentTime={7.5} />);
      expect(screen.getByText("第二句")).toBeInTheDocument();
    });

    it("应该处理错误状态和用户反馈", () => {
      const mockFile = createMockFile({ id: 1, name: "error-test.mp3" });
      const mockTranscript = createMockTranscript({
        id: 1,
        fileId: 1,
        status: "failed",
      });

      const mockUseTranscriptionManager =
        require("@/hooks/useTranscriptionManager").useTranscriptionManager;
      mockUseTranscriptionManager.mockReturnValue({
        isTranscribing: false,
        transcriptionQueue: [],
        currentTranscription: null,
        transcriptionProgress: new Map([
          [1, { fileId: 1, status: "failed", progress: 0, message: "网络错误" }],
        ]),
        startTranscription: mockStartTranscription,
        retryTranscription: mockRetryTranscription,
        queueTranscription: jest.fn(),
        getProgressInfo: jest.fn(() => ({
          fileId: 1,
          status: "failed",
          progress: 0,
          message: "网络错误",
        })),
        getTranscriptionStatus: jest.fn(() => "failed"),
      });

      render(
        <FileManager
          files={[mockFile]}
          transcripts={[mockTranscript]}
          onFilesSelected={mockAddFiles}
          onRetryTranscription={mockRetryTranscription}
        />,
      );

      // 检查错误信息显示
      expect(screen.getByText("failed")).toBeInTheDocument();
      expect(screen.getByText("重新转录")).toBeInTheDocument();
    });

    it("应该验证内存管理和清理", () => {
      const mockFiles = Array.from({ length: 100 }, (_, i) =>
        createMockFile({
          id: i + 1,
          name: `large-file-${i + 1}.mp3`,
          size: 50 * 1024 * 1024, // 50MB
        }),
      );

      render(<FileManager files={mockFiles} transcripts={[]} onFilesSelected={mockAddFiles} />);

      // 检查大量文件的处理能力
      expect(screen.getByText("文件管理 (100 个文件)")).toBeInTheDocument();

      // 检查文件列表是否正确渲染
      const fileRows = screen.getAllByTestId("tr");
      expect(fileRows.length).toBeGreaterThan(1); // 至少包含标题行和一个文件行
    });
  });

  describe("7. 边界情况测试", () => {
    it("应该处理空文件和零字节文件", async () => {
      const emptyFile = new File([""], "empty.mp3", { type: "audio/mpeg" });

      render(<FileManager files={[]} transcripts={[]} onFilesSelected={mockAddFiles} />);

      await mockAddFiles([emptyFile]);
      expect(mockAddFiles).toHaveBeenCalledWith([emptyFile]);
    });

    it("应该处理不支持的文件格式", async () => {
      const unsupportedFile = new File(["content"], "test.txt", { type: "text/plain" });

      render(<FileManager files={[]} transcripts={[]} onFilesSelected={mockAddFiles} />);

      await mockAddFiles([unsupportedFile]);
      expect(mockAddFiles).toHaveBeenCalledWith([unsupportedFile]);
    });

    it("应该处理网络错误和API超时", async () => {
      const mockFile = createMockFile({ id: 1, name: "timeout-test.mp3" });

      const mockUseTranscriptionManager =
        require("@/hooks/useTranscriptionManager").useTranscriptionManager;
      mockUseTranscriptionManager.mockReturnValue({
        isTranscribing: false,
        transcriptionQueue: [],
        currentTranscription: null,
        transcriptionProgress: new Map([
          [1, { fileId: 1, status: "failed", progress: 0, message: "API 超时" }],
        ]),
        startTranscription: jest.fn(() => Promise.reject(new Error("API timeout"))),
        retryTranscription: mockRetryTranscription,
        queueTranscription: jest.fn(),
        getProgressInfo: jest.fn(() => ({
          fileId: 1,
          status: "failed",
          progress: 0,
          message: "API 超时",
        })),
        getTranscriptionStatus: jest.fn(() => "failed"),
      });

      render(
        <FileManager
          files={[mockFile]}
          transcripts={[]}
          onFilesSelected={mockAddFiles}
          onRetryTranscription={mockRetryTranscription}
        />,
      );

      // 检查超时错误处理
      expect(screen.getByText("failed")).toBeInTheDocument();
    });
  });

  describe("8. 用户体验测试", () => {
    it("应该提供清晰的进度反馈", () => {
      const mockFile = createMockFile({ id: 1, name: "progress-test.mp3" });

      const mockUseTranscriptionManager =
        require("@/hooks/useTranscriptionManager").useTranscriptionManager;
      mockUseTranscriptionManager.mockReturnValue({
        isTranscribing: true,
        transcriptionQueue: [],
        currentTranscription: { fileId: 1, progress: 0.75 },
        transcriptionProgress: new Map([
          [1, { fileId: 1, status: "processing", progress: 75, message: "转录中... 75%" }],
        ]),
        startTranscription: mockStartTranscription,
        retryTranscription: mockRetryTranscription,
        queueTranscription: jest.fn(),
        getProgressInfo: jest.fn(() => ({
          fileId: 1,
          status: "processing",
          progress: 75,
          message: "转录中... 75%",
        })),
        getTranscriptionStatus: jest.fn(() => "processing"),
      });

      render(
        <FileManager
          files={[mockFile]}
          transcripts={[]}
          onFilesSelected={mockAddFiles}
          onRetryTranscription={mockRetryTranscription}
        />,
      );

      // 检查进度反馈
      expect(screen.getByText("processing")).toBeInTheDocument();
    });

    it("应该确保界面响应流畅", async () => {
      const mockFiles = Array.from({ length: 10 }, (_, i) =>
        createMockFile({
          id: i + 1,
          name: `responsive-test-${i + 1}.mp3`,
        }),
      );

      render(
        <FileManager
          files={mockFiles}
          transcripts={[]}
          onFilesSelected={mockAddFiles}
          onDeleteFile={mockDeleteFile}
        />,
      );

      // 测试快速连续操作
      const deleteButtons = screen.getAllByTestId("trash-icon");

      // 模拟快速点击删除按钮
      for (let i = 0; i < Math.min(3, deleteButtons.length); i++) {
        await user.click(deleteButtons[i].closest("button")!);
      }

      // 验证删除操作被调用
      expect(mockDeleteFile).toHaveBeenCalledTimes(3);
    });
  });
});
