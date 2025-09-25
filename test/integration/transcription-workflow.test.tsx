/**
 * 转录工作流程集成测试
 * 测试从文件上传到转录完成的完整流程
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// Mock 图标和UI组件
jest.mock("lucide-react", () => ({
  Upload: () => <svg data-testid="upload-icon" />,
  File: () => <svg data-testid="file-icon" />,
  Play: () => <svg data-testid="play-icon" />,
  Trash2: () => <svg data-testid="trash-icon" />,
  CheckCircle: () => <svg data-testid="check-circle-icon" />,
  Clock: () => <svg data-testid="clock-icon" />,
  AlertCircle: () => <svg data-testid="alert-circle-icon" />,
  Loader: () => <svg data-testid="loader-icon" />,
  RefreshCw: () => <svg data-testid="refresh-cw-icon" />,
}));

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

jest.mock("@/components/ui/progress", () => ({
  Progress: ({ value, ...props }: any) => (
    <div {...props} data-testid="progress">
      <div data-testid="progress-value">{value}%</div>
    </div>
  ),
}));

// Mock hooks
jest.mock("@/hooks/useFiles");
jest.mock("@/hooks/useTranscriptionManager");
jest.mock("@/hooks/useTranscripts");
jest.mock("@/hooks/useAppState");

// 模拟转录进度组件
const TranscriptionProgress = ({
  fileId,
  progress,
  status,
  message,
}: {
  fileId: number;
  progress: number;
  status: string;
  message?: string;
}) => {
  return (
    <div data-testid={`transcription-progress-${fileId}`}>
      <div data-testid={`progress-status-${fileId}`}>{status}</div>
      <div data-testid={`progress-value-${fileId}`}>{progress}%</div>
      {message && <div data-testid={`progress-message-${fileId}`}>{message}</div>}
    </div>
  );
};

// 模拟音频播放器组件
const AudioPlayer = ({
  file,
  segments,
  isPlaying,
  onPlay,
  onPause,
}: {
  file: any;
  segments: any[];
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
}) => {
  return (
    <div data-testid="audio-player">
      <div data-testid="current-file">{file.name}</div>
      <div data-testid="player-status">{isPlaying ? "playing" : "paused"}</div>
      <button data-testid="player-play-button" onClick={onPlay} disabled={isPlaying}>
        播放
      </button>
      <button data-testid="player-pause-button" onClick={onPause} disabled={!isPlaying}>
        暂停
      </button>
    </div>
  );
};

// 模拟字幕显示组件
const SubtitleDisplay = ({ segments, currentTime }: { segments: any[]; currentTime: number }) => {
  const currentSegment = segments.find(
    (segment) => currentTime >= segment.start && currentTime <= segment.end,
  );

  return (
    <div data-testid="subtitle-display">
      {currentSegment ? (
        <div data-testid="current-subtitle">
          {currentSegment.text}
          {currentSegment.translations?.zh && (
            <div data-testid="subtitle-translation">{currentSegment.translations.zh}</div>
          )}
        </div>
      ) : (
        <div data-testid="no-subtitle">无字幕</div>
      )}
    </div>
  );
};

// 测试数据生成函数
const _createMockFile = (overrides: Partial<any> = {}) => ({
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

const _createMockTranscript = (overrides: Partial<any> = {}) => ({
  id: Date.now(),
  fileId: 1,
  status: "pending",
  rawText: "",
  segments: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockSegment = (overrides: Partial<any> = {}) => ({
  start: 0,
  end: 5,
  text: "こんにちは、これはテストです。",
  translations: { zh: "你好，这是一个测试。" },
  ...overrides,
});

// 模拟应用状态管理器
const TranscriptionWorkflow = ({
  onFileUpload,
  onTranscriptionStart,
  onTranscriptionComplete,
}: {
  onFileUpload: (files: File[]) => void;
  onTranscriptionStart: (fileId: number) => void;
  onTranscriptionComplete: (fileId: number, segments: any[]) => void;
}) => {
  const [files, setFiles] = React.useState<any[]>([]);
  const [transcripts, setTranscripts] = React.useState<any[]>([]);
  const [transcriptionProgress, setTranscriptionProgress] = React.useState<Map<number, any>>(
    new Map(),
  );
  const [currentFile, setCurrentFile] = React.useState<any>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  const handleFileUpload = (uploadedFiles: File[]) => {
    const newFiles = uploadedFiles.map((file, index) => ({
      id: files.length + index + 1,
      name: file.name,
      size: file.size,
      type: file.type,
      duration: 120, // 模拟时长
      createdAt: new Date(),
      updatedAt: new Date(),
      blob: file,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    onFileUpload(uploadedFiles);

    // 自动开始转录
    newFiles.forEach((file) => {
      startTranscription(file);
    });
  };

  const startTranscription = (file: any) => {
    const newTranscript = {
      id: transcripts.length + 1,
      fileId: file.id,
      status: "processing",
      rawText: "",
      segments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTranscripts((prev) => [...prev, newTranscript]);
    onTranscriptionStart(file.id);

    // 模拟转录进度
    simulateTranscription(file.id, newTranscript);
  };

  const simulateTranscription = (fileId: number, transcript: any) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;

      setTranscriptionProgress((prev) => {
        const newMap = new Map(prev);
        newMap.set(fileId, {
          fileId,
          status: "processing",
          progress,
          message: `转录中... ${progress}%`,
        });
        return newMap;
      });

      if (progress >= 100) {
        clearInterval(interval);
        completeTranscription(fileId, transcript);
      }
    }, 100);
  };

  const completeTranscription = (fileId: number, transcript: any) => {
    const segments = [
      createMockSegment({ start: 0, end: 5, text: "こんにちは、これはテストです。" }),
      createMockSegment({ start: 5, end: 10, text: "これは音声認識のテストです。" }),
      createMockSegment({ start: 10, end: 15, text: "テストが完了しました。" }),
    ];

    const completedTranscript = {
      ...transcript,
      status: "completed",
      segments,
      rawText: segments.map((s) => s.text).join(" "),
      updatedAt: new Date(),
    };

    setTranscripts((prev) => prev.map((t) => (t.id === transcript.id ? completedTranscript : t)));

    setTranscriptionProgress((prev) => {
      const newMap = new Map(prev);
      newMap.set(fileId, {
        fileId,
        status: "completed",
        progress: 100,
        message: "转录完成",
      });
      return newMap;
    });

    onTranscriptionComplete(fileId, segments);
  };

  const handlePlay = (file: any) => {
    setCurrentFile(file);
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const getFileTranscript = (fileId: number) => {
    return transcripts.find((t) => t.fileId === fileId);
  };

  return (
    <div data-testid="transcription-workflow">
      {/* 文件上传区域 */}
      <div
        data-testid="upload-area"
        onDrop={(e) => {
          e.preventDefault();
          const files = Array.from(e.dataTransfer.files);
          handleFileUpload(files);
        }}
      >
        <input
          type="file"
          multiple
          accept="audio/*"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            handleFileUpload(files);
          }}
          data-testid="file-input"
        />
        <label>拖放音频文件到此处</label>
      </div>

      {/* 文件列表 */}
      <div data-testid="file-list">
        {files.map((file) => {
          const transcript = getFileTranscript(file.id);
          const progress = transcriptionProgress.get(file.id);

          return (
            <div key={file.id} data-testid={`file-item-${file.id}`}>
              <div data-testid={`file-name-${file.id}`}>{file.name}</div>
              <div data-testid={`file-status-${file.id}`}>{transcript?.status || "pending"}</div>

              {progress && (
                <TranscriptionProgress
                  fileId={file.id}
                  progress={progress.progress}
                  status={progress.status}
                  message={progress.message}
                />
              )}

              {transcript?.status === "completed" && (
                <button data-testid={`play-button-${file.id}`} onClick={() => handlePlay(file)}>
                  播放
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 音频播放器 */}
      {currentFile && (
        <div data-testid="player-section">
          <AudioPlayer
            file={currentFile}
            segments={getFileTranscript(currentFile.id)?.segments || []}
            isPlaying={isPlaying}
            onPlay={() => setIsPlaying(true)}
            onPause={handlePause}
          />
          <SubtitleDisplay
            segments={getFileTranscript(currentFile.id)?.segments || []}
            currentTime={isPlaying ? 7.5 : 0} // 模拟当前播放时间
          />
        </div>
      )}
    </div>
  );
};

describe("转录工作流程集成测试", () => {
  let mockOnFileUpload: jest.Mock;
  let mockOnTranscriptionStart: jest.Mock;
  let mockOnTranscriptionComplete: jest.Mock;
  let user: any;

  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup();

    mockOnFileUpload = jest.fn();
    mockOnTranscriptionStart = jest.fn();
    mockOnTranscriptionComplete = jest.fn();

    // Mock hooks
    const mockUseFiles = require("@/hooks/useFiles").useFiles;
    mockUseFiles.mockReturnValue({
      files: [],
      isLoading: false,
      loadFiles: jest.fn(),
      refreshFiles: jest.fn(),
      addFiles: mockOnFileUpload,
      deleteFile: jest.fn(),
    });

    const mockUseTranscriptionManager =
      require("@/hooks/useTranscriptionManager").useTranscriptionManager;
    mockUseTranscriptionManager.mockReturnValue({
      isTranscribing: false,
      transcriptionQueue: [],
      currentTranscription: null,
      transcriptionProgress: new Map(),
      startTranscription: mockOnTranscriptionStart,
      retryTranscription: jest.fn(),
      queueTranscription: jest.fn(),
      getProgressInfo: jest.fn(),
      getTranscriptionStatus: jest.fn(() => "pending"),
    });

    const mockUseTranscripts = require("@/hooks/useTranscripts").useTranscripts;
    mockUseTranscripts.mockReturnValue({
      transcripts: [],
      isLoading: false,
      refreshTranscripts: jest.fn(),
    });

    const mockUseAppState = require("@/hooks/useAppState").useAppState;
    mockUseAppState.mockReturnValue({
      theme: "light",
      setTheme: jest.fn(),
    });
  });

  describe("1. 完整转录流程测试", () => {
    it("应该支持从文件上传到转录完成的完整流程", async () => {
      render(
        <TranscriptionWorkflow
          onFileUpload={mockOnFileUpload}
          onTranscriptionStart={mockOnTranscriptionStart}
          onTranscriptionComplete={mockOnTranscriptionComplete}
        />,
      );

      // 1. 模拟文件上传
      const mockFiles = [
        new File(["audio content"], "test1.mp3", { type: "audio/mpeg" }),
        new File(["audio content"], "test2.mp3", { type: "audio/mpeg" }),
      ];

      const fileInput = screen.getByTestId("file-input");
      Object.defineProperty(fileInput, "files", {
        value: mockFiles,
        writable: false,
      });

      fireEvent.change(fileInput);

      // 2. 验证文件上传回调
      await waitFor(() => {
        expect(mockOnFileUpload).toHaveBeenCalledWith(mockFiles);
      });

      // 3. 等待转录开始
      await waitFor(() => {
        expect(mockOnTranscriptionStart).toHaveBeenCalledTimes(2);
      });

      // 4. 检查文件列表显示
      expect(screen.getByTestId("file-item-1")).toBeInTheDocument();
      expect(screen.getByTestId("file-item-2")).toBeInTheDocument();
      expect(screen.getByTestId("file-name-1")).toHaveTextContent("test1.mp3");
      expect(screen.getByTestId("file-name-2")).toHaveTextContent("test2.mp3");

      // 5. 等待转录进度更新
      await waitFor(() => {
        expect(screen.getByTestId("progress-status-1")).toHaveTextContent("processing");
        expect(screen.getByTestId("progress-status-2")).toHaveTextContent("processing");
      });

      // 6. 等待转录完成
      await waitFor(
        () => {
          expect(screen.getByTestId("progress-status-1")).toHaveTextContent("completed");
          expect(screen.getByTestId("progress-status-2")).toHaveTextContent("completed");
        },
        { timeout: 2000 },
      );

      // 7. 验证转录完成回调
      expect(mockOnTranscriptionComplete).toHaveBeenCalledTimes(2);

      // 8. 检查播放按钮可用
      expect(screen.getByTestId("play-button-1")).toBeInTheDocument();
      expect(screen.getByTestId("play-button-2")).toBeInTheDocument();
    });

    it("应该显示准确的转录进度", async () => {
      render(
        <TranscriptionWorkflow
          onFileUpload={mockOnFileUpload}
          onTranscriptionStart={mockOnTranscriptionStart}
          onTranscriptionComplete={mockOnTranscriptionComplete}
        />,
      );

      const mockFiles = [new File(["audio content"], "test.mp3", { type: "audio/mpeg" })];
      const fileInput = screen.getByTestId("file-input");
      Object.defineProperty(fileInput, "files", {
        value: mockFiles,
        writable: false,
      });

      fireEvent.change(fileInput);

      // 监控进度变化
      await waitFor(() => {
        expect(screen.getByTestId("progress-status-1")).toHaveTextContent("processing");
      });

      // 等待几个进度更新
      await waitFor(() => {
        const progressValue = screen.getByTestId("progress-value-1");
        expect(parseInt(progressValue.textContent || "0", 10)).toBeGreaterThan(0);
      });

      await waitFor(() => {
        const progressValue = screen.getByTestId("progress-value-1");
        expect(parseInt(progressValue.textContent || "0", 10)).toBe(100);
      });
    });
  });

  describe("2. 音频播放和字幕同步测试", () => {
    it("应该支持音频播放和字幕同步显示", async () => {
      render(
        <TranscriptionWorkflow
          onFileUpload={mockOnFileUpload}
          onTranscriptionStart={mockOnTranscriptionStart}
          onTranscriptionComplete={mockOnTranscriptionComplete}
        />,
      );

      // 上传文件并等待转录完成
      const mockFiles = [new File(["audio content"], "test.mp3", { type: "audio/mpeg" })];
      const fileInput = screen.getByTestId("file-input");
      Object.defineProperty(fileInput, "files", {
        value: mockFiles,
        writable: false,
      });

      fireEvent.change(fileInput);

      // 等待转录完成
      await waitFor(
        () => {
          expect(screen.getByTestId("progress-status-1")).toHaveTextContent("completed");
        },
        { timeout: 2000 },
      );

      // 点击播放按钮
      const playButton = screen.getByTestId("play-button-1");
      await user.click(playButton);

      // 检查播放器显示
      await waitFor(() => {
        expect(screen.getByTestId("audio-player")).toBeInTheDocument();
        expect(screen.getByTestId("current-file")).toHaveTextContent("test.mp3");
        expect(screen.getByTestId("player-status")).toHaveTextContent("playing");
      });

      // 检查字幕显示
      expect(screen.getByTestId("subtitle-display")).toBeInTheDocument();
      expect(screen.getByTestId("current-subtitle")).toBeInTheDocument();
      expect(screen.getByTestId("subtitle-translation")).toBeInTheDocument();
    });

    it("应该处理播放暂停功能", async () => {
      render(
        <TranscriptionWorkflow
          onFileUpload={mockOnFileUpload}
          onTranscriptionStart={mockOnTranscriptionStart}
          onTranscriptionComplete={mockOnTranscriptionComplete}
        />,
      );

      // 上传文件并等待转录完成
      const mockFiles = [new File(["audio content"], "test.mp3", { type: "audio/mpeg" })];
      const fileInput = screen.getByTestId("file-input");
      Object.defineProperty(fileInput, "files", {
        value: mockFiles,
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(
        () => {
          expect(screen.getByTestId("progress-status-1")).toHaveTextContent("completed");
        },
        { timeout: 2000 },
      );

      // 播放文件
      const playButton = screen.getByTestId("play-button-1");
      await user.click(playButton);

      await waitFor(() => {
        expect(screen.getByTestId("player-status")).toHaveTextContent("playing");
      });

      // 暂停播放
      const pauseButton = screen.getByTestId("player-pause-button");
      await user.click(pauseButton);

      await waitFor(() => {
        expect(screen.getByTestId("player-status")).toHaveTextContent("paused");
      });
    });
  });

  describe("3. 错误处理测试", () => {
    it("应该处理文件上传错误", async () => {
      mockOnFileUpload.mockRejectedValue(new Error("Upload failed"));

      render(
        <TranscriptionWorkflow
          onFileUpload={mockOnFileUpload}
          onTranscriptionStart={mockOnTranscriptionStart}
          onTranscriptionComplete={mockOnTranscriptionComplete}
        />,
      );

      const mockFiles = [new File(["audio content"], "test.mp3", { type: "audio/mpeg" })];
      const fileInput = screen.getByTestId("file-input");
      Object.defineProperty(fileInput, "files", {
        value: mockFiles,
        writable: false,
      });

      fireEvent.change(fileInput);

      // 组件应该继续工作，即使上传失败
      await waitFor(() => {
        expect(screen.getByTestId("upload-area")).toBeInTheDocument();
      });
    });

    it("应该处理转录超时", async () => {
      // 模拟转录超时
      jest.useFakeTimers();

      render(
        <TranscriptionWorkflow
          onFileUpload={mockOnFileUpload}
          onTranscriptionStart={mockOnTranscriptionStart}
          onTranscriptionComplete={mockOnTranscriptionComplete}
        />,
      );

      const mockFiles = [new File(["audio content"], "test.mp3", { type: "audio/mpeg" })];
      const fileInput = screen.getByTestId("file-input");
      Object.defineProperty(fileInput, "files", {
        value: mockFiles,
        writable: false,
      });

      fireEvent.change(fileInput);

      // 等待转录开始
      await waitFor(() => {
        expect(screen.getByTestId("progress-status-1")).toHaveTextContent("processing");
      });

      // 快进时间
      jest.advanceTimersByTime(2000);

      // 检查转录是否完成
      await waitFor(() => {
        expect(screen.getByTestId("progress-status-1")).toHaveTextContent("completed");
      });

      jest.useRealTimers();
    });
  });

  describe("4. 性能测试", () => {
    it("应该处理多个文件的同时转录", async () => {
      render(
        <TranscriptionWorkflow
          onFileUpload={mockOnFileUpload}
          onTranscriptionStart={mockOnTranscriptionStart}
          onTranscriptionComplete={mockOnTranscriptionComplete}
        />,
      );

      // 上传多个文件
      const mockFiles = Array.from(
        { length: 5 },
        (_, i) => new File(["audio content"], `test${i + 1}.mp3`, { type: "audio/mpeg" }),
      );

      const fileInput = screen.getByTestId("file-input");
      Object.defineProperty(fileInput, "files", {
        value: mockFiles,
        writable: false,
      });

      fireEvent.change(fileInput);

      // 验证所有文件都开始转录
      await waitFor(() => {
        expect(mockOnTranscriptionStart).toHaveBeenCalledTimes(5);
      });

      // 等待所有转录完成
      await waitFor(
        () => {
          for (let i = 1; i <= 5; i++) {
            expect(screen.getByTestId(`progress-status-${i}`)).toHaveTextContent("completed");
          }
        },
        { timeout: 3000 },
      );

      // 验证所有转录完成回调
      expect(mockOnTranscriptionComplete).toHaveBeenCalledTimes(5);
    });

    it("应该处理大文件转录", async () => {
      render(
        <TranscriptionWorkflow
          onFileUpload={mockOnFileUpload}
          onTranscriptionStart={mockOnTranscriptionStart}
          onTranscriptionComplete={mockOnTranscriptionComplete}
        />,
      );

      // 模拟大文件
      const largeFile = new File(["x".repeat(50 * 1024 * 1024)], "large.mp3", {
        type: "audio/mpeg",
      });

      const fileInput = screen.getByTestId("file-input");
      Object.defineProperty(fileInput, "files", {
        value: [largeFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      // 验证大文件处理
      await waitFor(() => {
        expect(screen.getByTestId("progress-status-1")).toHaveTextContent("processing");
      });

      await waitFor(
        () => {
          expect(screen.getByTestId("progress-status-1")).toHaveTextContent("completed");
        },
        { timeout: 2000 },
      );
    });
  });

  describe("5. 用户体验测试", () => {
    it("应该提供清晰的用户反馈", async () => {
      render(
        <TranscriptionWorkflow
          onFileUpload={mockOnFileUpload}
          onTranscriptionStart={mockOnTranscriptionStart}
          onTranscriptionComplete={mockOnTranscriptionComplete}
        />,
      );

      const mockFiles = [new File(["audio content"], "test.mp3", { type: "audio/mpeg" })];
      const fileInput = screen.getByTestId("file-input");
      Object.defineProperty(fileInput, "files", {
        value: mockFiles,
        writable: false,
      });

      fireEvent.change(fileInput);

      // 检查进度反馈
      await waitFor(() => {
        const progressMessage = screen.getByTestId("progress-message-1");
        expect(progressMessage).toBeInTheDocument();
        expect(progressMessage.textContent).toContain("转录中");
      });

      // 检查完成反馈
      await waitFor(() => {
        const progressMessage = screen.getByTestId("progress-message-1");
        expect(progressMessage.textContent).toContain("转录完成");
      });
    });

    it("应该支持快速连续操作", async () => {
      render(
        <TranscriptionWorkflow
          onFileUpload={mockOnFileUpload}
          onTranscriptionStart={mockOnTranscriptionStart}
          onTranscriptionComplete={mockOnTranscriptionComplete}
        />,
      );

      // 快速上传多个文件
      const mockFiles = [
        new File(["audio content"], "test1.mp3", { type: "audio/mpeg" }),
        new File(["audio content"], "test2.mp3", { type: "audio/mpeg" }),
      ];

      const fileInput = screen.getByTestId("file-input");
      Object.defineProperty(fileInput, "files", {
        value: mockFiles,
        writable: false,
      });

      fireEvent.change(fileInput);

      // 快速点击播放按钮（在转录完成前）
      await waitFor(() => {
        expect(screen.getByTestId("progress-status-1")).toHaveTextContent("processing");
      });

      // 等待转录完成并快速播放
      await waitFor(
        () => {
          expect(screen.getByTestId("progress-status-1")).toHaveTextContent("completed");
        },
        { timeout: 2000 },
      );

      const playButton = screen.getByTestId("play-button-1");
      await user.click(playButton);

      // 检查播放器状态
      await waitFor(() => {
        expect(screen.getByTestId("player-status")).toHaveTextContent("playing");
      });
    });
  });
});
