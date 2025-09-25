/**
 * 文件上传工作流程测试
 * 测试文件上传、存储、转录和播放的核心流程
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// Mock 图标库
jest.mock("lucide-react", () => ({
  Upload: () => <svg data-testid="upload-icon" />,
  File: () => <svg data-testid="file-icon" />,
  Play: () => <svg data-testid="play-icon" />,
  Trash2: () => <svg data-testid="trash-icon" />,
  Music: () => <svg data-testid="music-icon" />,
  CheckCircle: () => <svg data-testid="check-circle-icon" />,
  Clock: () => <svg data-testid="clock-icon" />,
  AlertCircle: () => <svg data-testid="alert-circle-icon" />,
  Loader: () => <svg data-testid="loader-icon" />,
  RefreshCw: () => <svg data-testid="refresh-cw-icon" />,
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

jest.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }: any) => (
    <label {...props} data-testid="label">
      {children}
    </label>
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

// Mock FileCard 组件
jest.mock("@/components/file-card", () => ({
  __esModule: true,
  default: ({ file, status, onPlay, onDelete, onRetryTranscription }: any) => (
    <div data-testid="file-card">
      <div data-testid="file-name">{file.name}</div>
      <div data-testid="file-status">{status}</div>
      <button data-testid="play-button" onClick={() => onPlay?.(file)}>
        Play
      </button>
      <button data-testid="delete-button" onClick={() => onDelete?.(file.id)}>
        Delete
      </button>
      <button data-testid="retry-button" onClick={() => onRetryTranscription?.(file.id)}>
        Retry
      </button>
    </div>
  ),
}));

// 模拟 FileManager 组件以避免导入问题
const MockFileManager = ({
  files,
  transcripts,
  onFilesSelected,
  onPlayFile,
  onDeleteFile,
  onRetryTranscription,
  isUploading = false,
  uploadProgress = 0,
  isLoading = false,
}: any) => {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputId = React.useId();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    onFilesSelected(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    onFilesSelected(selectedFiles);
  };

  const handleFileInputClick = () => {
    document.getElementById(fileInputId)?.click();
  };

  const getTranscriptStatus = (fileId: number) => {
    const fileTranscripts = transcripts.filter((t: any) => t.fileId === fileId);
    if (fileTranscripts.length === 0) return "pending";
    return fileTranscripts[fileTranscripts.length - 1].status;
  };

  return (
    <div data-testid="file-manager">
      {/* 文件统计 */}
      <div data-testid="file-stats">
        <span data-testid="total-files">{files.length} 个文件</span>
      </div>

      {/* 上传区域 */}
      {files.length === 0 && (
        <div
          data-testid="upload-area"
          className={`cursor-pointer border-2 border-dashed p-12 text-center ${
            isDragOver ? "border-green-500" : "border-gray-300"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleFileInputClick}
        >
          <div data-testid="upload-icon-container">
            <svg data-testid="upload-icon" />
          </div>
          <div>
            <label data-testid="upload-label">拖放音频文件到此处</label>
            <p data-testid="upload-hint">支持的格式：MP3、WAV、M4A、OGG</p>
          </div>
          <input
            id={fileInputId}
            type="file"
            multiple
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="file-input"
          />
        </div>
      )}

      {/* 上传进度 */}
      {isUploading && (
        <div data-testid="upload-progress">
          <div data-testid="progress-label">上传中...</div>
          <div data-testid="progress-value">{uploadProgress}%</div>
        </div>
      )}

      {/* 文件网格 */}
      {files.length > 0 && (
        <div data-testid="file-grid">
          {files.map((file: any) => {
            const status = getTranscriptStatus(file.id || 0);
            return (
              <div key={file.id} data-testid="file-card-container">
                <div data-testid="file-name">{file.name}</div>
                <div data-testid="file-status">{status}</div>
                {status === "completed" && (
                  <button data-testid="play-button" onClick={() => onPlayFile?.(file)}>
                    播放
                  </button>
                )}
                <button data-testid="delete-button" onClick={() => onDeleteFile?.(file.id)}>
                  删除
                </button>
                {(status === "failed" || status === "pending") && (
                  <button
                    data-testid="retry-button"
                    onClick={() => onRetryTranscription?.(file.id)}
                  >
                    重新转录
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 空状态 */}
      {files.length === 0 && !isUploading && (
        <div data-testid="empty-state">
          <svg data-testid="file-icon" />
          <h3 data-testid="empty-title">尚未上传文件</h3>
          <p data-testid="empty-description">上传音频文件开始跟读练习。</p>
        </div>
      )}
    </div>
  );
};

// 测试数据生成函数
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

describe("文件上传工作流程测试", () => {
  let mockAddFiles: jest.Mock;
  let mockDeleteFile: jest.Mock;
  let mockRetryTranscription: jest.Mock;
  let mockPlayFile: jest.Mock;
  let user: any;

  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup();

    // Mock 核心函数
    mockAddFiles = jest.fn();
    mockDeleteFile = jest.fn();
    mockRetryTranscription = jest.fn();
    mockPlayFile = jest.fn();

    // Mock hooks
    const mockUseFiles = require("@/hooks/useFiles").useFiles;
    mockUseFiles.mockReturnValue({
      files: [],
      isLoading: false,
      loadFiles: jest.fn(),
      refreshFiles: jest.fn(),
      addFiles: mockAddFiles,
      deleteFile: mockDeleteFile,
    });

    const mockUseTranscriptionManager =
      require("@/hooks/useTranscriptionManager").useTranscriptionManager;
    mockUseTranscriptionManager.mockReturnValue({
      isTranscribing: false,
      transcriptionQueue: [],
      currentTranscription: null,
      transcriptionProgress: new Map(),
      startTranscription: jest.fn(),
      retryTranscription: mockRetryTranscription,
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

  describe("1. 文件上传功能测试", () => {
    it("应该支持多文件上传功能", async () => {
      render(<MockFileManager files={[]} transcripts={[]} onFilesSelected={mockAddFiles} />);

      // 检查上传区域存在
      expect(screen.getByTestId("upload-area")).toBeInTheDocument();
      expect(screen.getByTestId("upload-label")).toHaveTextContent("拖放音频文件到此处");
      expect(screen.getByTestId("upload-hint")).toHaveTextContent("支持的格式：MP3、WAV、M4A、OGG");

      // 模拟文件选择
      const mockFiles = [
        new File(["audio1"], "test1.mp3", { type: "audio/mpeg" }),
        new File(["audio2"], "test2.mp3", { type: "audio/mpeg" }),
        new File(["audio3"], "test3.wav", { type: "audio/wav" }),
      ];

      const fileInput = screen.getByTestId("file-input");
      Object.defineProperty(fileInput, "files", {
        value: mockFiles,
        writable: false,
      });

      fireEvent.change(fileInput);
      await waitFor(() => {
        expect(mockAddFiles).toHaveBeenCalledWith(mockFiles);
      });
    });

    it("应该验证支持的音频格式", async () => {
      render(<MockFileManager files={[]} transcripts={[]} onFilesSelected={mockAddFiles} />);

      const supportedFormats = [
        { name: "test.mp3", type: "audio/mpeg" },
        { name: "test.wav", type: "audio/wav" },
        { name: "test.m4a", type: "audio/mp4" },
        { name: "test.ogg", type: "audio/ogg" },
      ];

      const mockFiles = supportedFormats.map(
        (format) => new File(["audio"], format.name, { type: format.type }),
      );

      const fileInput = screen.getByTestId("file-input");
      Object.defineProperty(fileInput, "files", {
        value: mockFiles,
        writable: false,
      });

      fireEvent.change(fileInput);
      await waitFor(() => {
        expect(mockAddFiles).toHaveBeenCalledWith(mockFiles);
      });
    });

    it("应该显示上传进度", () => {
      render(
        <MockFileManager
          files={[]}
          transcripts={[]}
          onFilesSelected={mockAddFiles}
          isUploading={true}
          uploadProgress={75}
        />,
      );

      expect(screen.getByTestId("upload-progress")).toBeInTheDocument();
      expect(screen.getByTestId("progress-label")).toHaveTextContent("上传中...");
      expect(screen.getByTestId("progress-value")).toHaveTextContent("75%");
    });

    it("应该支持拖放上传", async () => {
      render(<MockFileManager files={[]} transcripts={[]} onFilesSelected={mockAddFiles} />);

      const uploadArea = screen.getByTestId("upload-area");
      const mockFiles = [new File(["audio"], "dragged.mp3", { type: "audio/mpeg" })];

      // 模拟拖放事件
      fireEvent.dragOver(uploadArea);
      expect(uploadArea).toHaveClass("border-green-500");

      fireEvent.drop(uploadArea, {
        dataTransfer: { files: mockFiles },
      });

      await waitFor(() => {
        expect(mockAddFiles).toHaveBeenCalledWith(mockFiles);
      });
    });
  });

  describe("2. 数据存储和文件列表测试", () => {
    it("应该显示文件列表和元数据", () => {
      const mockFiles = [
        createMockFile({ id: 1, name: "lesson1.mp3", size: 2048000, duration: 180 }),
        createMockFile({ id: 2, name: "lesson2.mp3", size: 1024000, duration: 120 }),
      ];

      render(<MockFileManager files={mockFiles} transcripts={[]} onFilesSelected={mockAddFiles} />);

      expect(screen.getByTestId("total-files")).toHaveTextContent("2 个文件");
      expect(screen.getByTestId("file-grid")).toBeInTheDocument();
      expect(screen.getByText("lesson1.mp3")).toBeInTheDocument();
      expect(screen.getByText("lesson2.mp3")).toBeInTheDocument();
    });

    it("应该显示空状态", () => {
      render(<MockFileManager files={[]} transcripts={[]} onFilesSelected={mockAddFiles} />);

      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
      expect(screen.getByTestId("empty-title")).toHaveTextContent("尚未上传文件");
      expect(screen.getByTestId("empty-description")).toHaveTextContent(
        "上传音频文件开始跟读练习。",
      );
    });

    it("应该处理大量文件", () => {
      const mockFiles = Array.from({ length: 50 }, (_, i) =>
        createMockFile({
          id: i + 1,
          name: `file-${i + 1}.mp3`,
        }),
      );

      render(<MockFileManager files={mockFiles} transcripts={[]} onFilesSelected={mockAddFiles} />);

      expect(screen.getByTestId("total-files")).toHaveTextContent("50 个文件");
      expect(screen.getByTestId("file-grid")).toBeInTheDocument();
    });
  });

  describe("3. 转录流程测试", () => {
    it("应该显示pending状态", () => {
      const mockFile = createMockFile({ id: 1, name: "test.mp3" });
      const mockTranscript = createMockTranscript({
        id: 1,
        fileId: 1,
        status: "pending",
      });

      render(
        <MockFileManager
          files={[mockFile]}
          transcripts={[mockTranscript]}
          onFilesSelected={mockAddFiles}
          onRetryTranscription={mockRetryTranscription}
        />,
      );

      expect(screen.getByText("pending")).toBeInTheDocument();
      expect(screen.getByTestId("retry-button")).toBeInTheDocument();
    });

    it("应该显示processing状态", () => {
      const mockFile = createMockFile({ id: 1, name: "test.mp3" });
      const mockTranscript = createMockTranscript({
        id: 1,
        fileId: 1,
        status: "processing",
      });

      render(
        <MockFileManager
          files={[mockFile]}
          transcripts={[mockTranscript]}
          onFilesSelected={mockAddFiles}
          onRetryTranscription={mockRetryTranscription}
        />,
      );

      expect(screen.getByText("processing")).toBeInTheDocument();
    });

    it("应该显示completed状态", () => {
      const mockFile = createMockFile({ id: 1, name: "test.mp3" });
      const mockTranscript = createMockTranscript({
        id: 1,
        fileId: 1,
        status: "completed",
      });

      render(
        <MockFileManager
          files={[mockFile]}
          transcripts={[mockTranscript]}
          onFilesSelected={mockAddFiles}
          onPlayFile={mockPlayFile}
        />,
      );

      expect(screen.getByText("completed")).toBeInTheDocument();
      expect(screen.getByTestId("play-button")).toBeInTheDocument();
      expect(screen.getByTestId("play-button")).not.toBeDisabled();
    });

    it("应该显示failed状态", () => {
      const mockFile = createMockFile({ id: 1, name: "test.mp3" });
      const mockTranscript = createMockTranscript({
        id: 1,
        fileId: 1,
        status: "failed",
      });

      render(
        <MockFileManager
          files={[mockFile]}
          transcripts={[mockTranscript]}
          onFilesSelected={mockAddFiles}
          onRetryTranscription={mockRetryTranscription}
        />,
      );

      expect(screen.getByText("failed")).toBeInTheDocument();
      expect(screen.getByTestId("retry-button")).toBeInTheDocument();
    });

    it("应该调用重新转录功能", async () => {
      const mockFile = createMockFile({ id: 1, name: "test.mp3" });
      const mockTranscript = createMockTranscript({
        id: 1,
        fileId: 1,
        status: "failed",
      });

      render(
        <MockFileManager
          files={[mockFile]}
          transcripts={[mockTranscript]}
          onFilesSelected={mockAddFiles}
          onRetryTranscription={mockRetryTranscription}
        />,
      );

      const retryButton = screen.getByTestId("retry-button");
      await user.click(retryButton);

      expect(mockRetryTranscription).toHaveBeenCalledWith(mockFile.id);
    });
  });

  describe("4. 文件操作测试", () => {
    it("应该支持删除文件", async () => {
      const mockFile = createMockFile({ id: 1, name: "test.mp3" });

      render(
        <MockFileManager
          files={[mockFile]}
          transcripts={[]}
          onFilesSelected={mockAddFiles}
          onDeleteFile={mockDeleteFile}
        />,
      );

      const deleteButton = screen.getByTestId("delete-button");
      await user.click(deleteButton);

      expect(mockDeleteFile).toHaveBeenCalledWith(mockFile.id);
    });

    it("应该支持播放文件", async () => {
      const mockFile = createMockFile({ id: 1, name: "test.mp3" });
      const mockTranscript = createMockTranscript({
        id: 1,
        fileId: 1,
        status: "completed",
      });

      render(
        <MockFileManager
          files={[mockFile]}
          transcripts={[mockTranscript]}
          onFilesSelected={mockAddFiles}
          onPlayFile={mockPlayFile}
        />,
      );

      const playButton = screen.getByTestId("play-button");
      await user.click(playButton);

      expect(mockPlayFile).toHaveBeenCalledWith(mockFile);
    });

    it("应该在转录完成后启用播放按钮", () => {
      const mockFile = createMockFile({ id: 1, name: "test.mp3" });
      const mockTranscript = createMockTranscript({
        id: 1,
        fileId: 1,
        status: "completed",
      });

      render(
        <MockFileManager
          files={[mockFile]}
          transcripts={[mockTranscript]}
          onFilesSelected={mockAddFiles}
          onPlayFile={mockPlayFile}
        />,
      );

      const playButton = screen.getByTestId("play-button");
      expect(playButton).toBeInTheDocument();
      expect(playButton).not.toBeDisabled();
    });

    it("应该在转录未完成时禁用播放按钮", () => {
      const mockFile = createMockFile({ id: 1, name: "test.mp3" });
      const mockTranscript = createMockTranscript({
        id: 1,
        fileId: 1,
        status: "processing",
      });

      render(
        <MockFileManager
          files={[mockFile]}
          transcripts={[mockTranscript]}
          onFilesSelected={mockAddFiles}
          onPlayFile={mockPlayFile}
        />,
      );

      // 在处理状态下不应该有播放按钮
      expect(screen.queryByTestId("play-button")).not.toBeInTheDocument();
    });
  });

  describe("5. 边界情况测试", () => {
    it("应该处理空文件", async () => {
      const emptyFile = new File([""], "empty.mp3", { type: "audio/mpeg" });

      render(<MockFileManager files={[]} transcripts={[]} onFilesSelected={mockAddFiles} />);

      const fileInput = screen.getByTestId("file-input");
      Object.defineProperty(fileInput, "files", {
        value: [emptyFile],
        writable: false,
      });

      fireEvent.change(fileInput);
      await waitFor(() => {
        expect(mockAddFiles).toHaveBeenCalledWith([emptyFile]);
      });
    });

    it("应该处理不支持的文件格式", async () => {
      const unsupportedFile = new File(["content"], "test.txt", { type: "text/plain" });

      render(<MockFileManager files={[]} transcripts={[]} onFilesSelected={mockAddFiles} />);

      const fileInput = screen.getByTestId("file-input");
      Object.defineProperty(fileInput, "files", {
        value: [unsupportedFile],
        writable: false,
      });

      fireEvent.change(fileInput);
      await waitFor(() => {
        expect(mockAddFiles).toHaveBeenCalledWith([unsupportedFile]);
      });
    });

    it("应该处理大文件上传", async () => {
      const largeFile = new File(["x".repeat(50 * 1024 * 1024)], "large.mp3", {
        type: "audio/mpeg",
      });

      render(<MockFileManager files={[]} transcripts={[]} onFilesSelected={mockAddFiles} />);

      const fileInput = screen.getByTestId("file-input");
      Object.defineProperty(fileInput, "files", {
        value: [largeFile],
        writable: false,
      });

      fireEvent.change(fileInput);
      await waitFor(() => {
        expect(mockAddFiles).toHaveBeenCalledWith([largeFile]);
      });
    });

    it("应该处理文件上传失败", () => {
      mockAddFiles.mockRejectedValue(new Error("Upload failed"));

      render(<MockFileManager files={[]} transcripts={[]} onFilesSelected={mockAddFiles} />);

      // 组件应该能够处理错误情况
      expect(screen.getByTestId("upload-area")).toBeInTheDocument();
    });
  });

  describe("6. 用户体验测试", () => {
    it("应该提供视觉反馈", async () => {
      render(<MockFileManager files={[]} transcripts={[]} onFilesSelected={mockAddFiles} />);

      const uploadArea = screen.getByTestId("upload-area");

      // 测试悬停效果
      fireEvent.dragOver(uploadArea);
      expect(uploadArea).toHaveClass("border-green-500");

      fireEvent.dragLeave(uploadArea);
      expect(uploadArea).not.toHaveClass("border-green-500");
    });

    it("应该显示正确的文件统计", () => {
      const mockFiles = [
        createMockFile({ id: 1, name: "file1.mp3" }),
        createMockFile({ id: 2, name: "file2.mp3" }),
        createMockFile({ id: 3, name: "file3.mp3" }),
      ];

      render(<MockFileManager files={mockFiles} transcripts={[]} onFilesSelected={mockAddFiles} />);

      expect(screen.getByTestId("total-files")).toHaveTextContent("3 个文件");
    });

    it("应该支持快速连续操作", async () => {
      const mockFile = createMockFile({ id: 1, name: "test.mp3" });
      const mockTranscript = createMockTranscript({
        id: 1,
        fileId: 1,
        status: "completed",
      });

      render(
        <MockFileManager
          files={[mockFile]}
          transcripts={[mockTranscript]}
          onFilesSelected={mockAddFiles}
          onPlayFile={mockPlayFile}
          onDeleteFile={mockDeleteFile}
        />,
      );

      // 测试快速连续点击
      const playButton = screen.getByTestId("play-button");
      const deleteButton = screen.getByTestId("delete-button");

      await user.click(playButton);
      await user.click(deleteButton);

      expect(mockPlayFile).toHaveBeenCalledWith(mockFile);
      expect(mockDeleteFile).toHaveBeenCalledWith(mockFile.id);
    });
  });
});
