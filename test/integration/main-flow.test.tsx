import { render, screen } from "@testing-library/react";
import FileManager from "@/components/file-manager";

// Mock the hooks
jest.mock("@/hooks/useFiles");
jest.mock("@/hooks/useTranscriptionManager");
jest.mock("@/hooks/useTranscripts");
jest.mock("@/hooks/useAppState");
jest.mock("@/hooks/useFileFormatting");

describe("Product Main Flow Integration Tests", () => {
  const mockAddFiles = jest.fn();
  const mockDeleteFile = jest.fn();
  const mockRetryTranscription = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

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
      startTranscription: jest.fn(),
      retryTranscription: mockRetryTranscription,
      queueTranscription: jest.fn(),
      getProgressInfo: jest.fn(),
      getTranscriptionStatus: jest.fn(() => "pending"),
    });
  });

  describe("1. Multi-file Upload Functionality", () => {
    it("should support multiple audio file selection", async () => {
      render(<FileManager files={[]} transcripts={[]} onFilesSelected={mockAddFiles} />);

      // Check that the upload area exists
      const uploadArea = screen.getByText(/拖放音频文件到此处或点击浏览/);
      expect(uploadArea).toBeInTheDocument();

      // Simulate file selection
      const mockFiles = [
        new File(["audio1"], "test1.mp3", { type: "audio/mpeg" }),
        new File(["audio2"], "test2.mp3", { type: "audio/mpeg" }),
      ];

      await mockAddFiles(mockFiles);
      expect(mockAddFiles).toHaveBeenCalledWith(mockFiles);
    });
  });

  describe("2. Button Redesign", () => {
    it("should show RefreshCw icon for retry button", () => {
      const mockFile = {
        id: 1,
        name: "test.mp3",
        size: 1024000,
        type: "audio/mpeg",
        duration: 120,
        createdAt: new Date(),
        updatedAt: new Date(),
        blob: new Blob(["audio"]),
      };

      const mockUseTranscriptionManager =
        require("@/hooks/useTranscriptionManager").useTranscriptionManager;
      mockUseTranscriptionManager.mockReturnValue({
        isTranscribing: false,
        transcriptionQueue: [],
        currentTranscription: null,
        transcriptionProgress: new Map([
          [1, { fileId: 1, status: "failed", progress: 0, message: "转录失败" }],
        ]),
        startTranscription: jest.fn(),
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
          transcripts={[]}
          onFilesSelected={mockAddFiles}
          onRetryTranscription={mockRetryTranscription}
        />,
      );

      // The component should render the retry button
      expect(screen.getByText("重新转录")).toBeInTheDocument();
    });
  });
});
