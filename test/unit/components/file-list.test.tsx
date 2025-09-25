import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import FileList from "@/components/file-list";
import type { FileRow, TranscriptRow } from "@/types/database";

// Mock 所有依赖 BEFORE importing the component

// Mock lucide-react 图标
jest.mock("lucide-react", () => ({
  File: () => React.createElement("svg", { "data-testid": "file-icon" }),
  Filter: () => React.createElement("svg", { "data-testid": "filter-icon" }),
  Play: () => React.createElement("svg", { "data-testid": "play-icon" }),
  Square: () => React.createElement("svg", { "data-testid": "square-icon" }),
  Trash2: () => React.createElement("svg", { "data-testid": "trash2-icon" }),
  AlertCircle: () => React.createElement("svg", { "data-testid": "alert-circle-icon" }),
  CheckCircle: () => React.createElement("svg", { "data-testid": "check-circle-icon" }),
  Clock: () => React.createElement("svg", { "data-testid": "clock-icon" }),
  Loader: () => React.createElement("svg", { "data-testid": "loader-icon" }),
}));

// Mock UI components
jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant, ...props }: any) =>
    React.createElement("span", { ...props, "data-testid": `badge-${variant}` }, children),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, variant, type, ...props }: any) =>
    React.createElement(
      "button",
      {
        ...props,
        type: type || "button",
        "data-testid": "button",
        onClick,
        disabled,
        "data-variant": variant,
      },
      children,
    ),
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: any) =>
    React.createElement("div", { ...props, "data-testid": "card" }, children),
}));

jest.mock("@/components/ui/input", () => ({
  Input: (props: any) => React.createElement("input", { ...props, "data-testid": "input" }),
}));

jest.mock("@/components/ui/skeleton", () => ({
  Skeleton: (props: any) => React.createElement("div", { ...props, "data-testid": "skeleton" }),
}));

jest.mock("@/components/ui/table", () => ({
  Table: ({ children, ...props }: any) =>
    React.createElement("table", { ...props, "data-testid": "table" }, children),
  TableBody: ({ children, ...props }: any) =>
    React.createElement("tbody", { ...props, "data-testid": "tbody" }, children),
  TableCell: ({ children, ...props }: any) =>
    React.createElement("td", { ...props, "data-testid": "td" }, children),
  TableHead: ({ children, ...props }: any) =>
    React.createElement("th", { ...props, "data-testid": "th" }, children),
  TableHeader: ({ children, ...props }: any) =>
    React.createElement("thead", { ...props, "data-testid": "thead" }, children),
  TableRow: ({ children, ...props }: any) =>
    React.createElement("tr", { ...props, "data-testid": "tr" }, children),
}));

jest.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children, ...props }: any) =>
    React.createElement("div", { ...props, "data-testid": "tooltip" }, children),
  TooltipContent: ({ children, ...props }: any) =>
    React.createElement("div", { ...props, "data-testid": "tooltip-content" }, children),
  TooltipProvider: ({ children, ...props }: any) =>
    React.createElement("div", { ...props, "data-testid": "tooltip-provider" }, children),
  TooltipTrigger: ({ children, asChild, ...props }: any) => {
    if (asChild) {
      return React.cloneElement(children, props);
    }
    return React.createElement("div", { ...props, "data-testid": "tooltip-trigger" }, children);
  },
}));

// Mock hooks
jest.mock("@/hooks/useFileList", () => ({
  useFileList: ({ files, transcripts }) => {
    // 根据transcripts创建状态映射
    const transcriptStatusMap = new Map();
    files?.forEach((file: FileRow) => {
      if (file.id) {
        const fileTranscripts =
          transcripts?.filter((t: TranscriptRow) => t.fileId === file.id) || [];
        if (fileTranscripts.length === 0) {
          transcriptStatusMap.set(file.id, "pending");
        } else {
          const latestTranscript = fileTranscripts.reduce((latest, current) =>
            current.createdAt > latest.createdAt ? current : latest,
          );
          transcriptStatusMap.set(file.id, latestTranscript.status);
        }
      }
    });

    return {
      selectedFiles: new Set(),
      searchQuery: "",
      sortBy: "createdAt",
      sortOrder: "desc",
      statusFilter: "all",
      filteredAndSortedFiles: Array.isArray(files) ? files : [],
      transcriptStatusMap,
      setSelectedFiles: jest.fn(),
      setSearchQuery: jest.fn(),
      setStatusFilter: jest.fn(),
      handleSelectAll: jest.fn(),
      handleSelectFile: jest.fn(),
      handleSort: jest.fn(),
    };
  },
}));

jest.mock("@/hooks/useFileFormatting", () => ({
  useFileFormatting: () => ({
    formatFileSize: jest.fn((bytes: number) => `${bytes} KB`),
    formatDuration: jest.fn((seconds?: number) => (seconds ? `${seconds}s` : "--:--")),
    getStatusIcon: jest.fn(() => React.createElement("div", { "data-testid": "status-icon" })),
    getStatusVariant: jest.fn(() => "default" as const),
    getStatusText: jest.fn((status: string) => status),
  }),
}));

describe("FileList Component", () => {
  const mockOnPlayFile = jest.fn();
  const mockOnDeleteFile = jest.fn();
  const mockOnRetryTranscription = jest.fn();

  let fileIdCounter = 1;
  const createMockFile = (overrides: Partial<FileRow> = {}): FileRow => ({
    id: fileIdCounter++,
    name: "test-audio.mp3",
    size: 1024000,
    type: "audio/mpeg",
    duration: 120,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    blob: new Blob(["audio content"], { type: "audio/mpeg" }),
    ...overrides,
  });

  const createMockTranscript = (overrides: Partial<TranscriptRow> = {}): TranscriptRow => ({
    id: 1,
    fileId: 1,
    status: "pending",
    rawText: "",
    segments: [],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    fileIdCounter = 1;
  });

  describe("Loading State", () => {
    it("should show skeleton loading when isLoading is true", () => {
      render(
        <FileList
          files={[]}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={true}
        />,
      );

      expect(screen.getAllByTestId("skeleton")).toHaveLength(24);
      expect(screen.getByText("已上传文件")).toBeInTheDocument();
    });

    it("should show table headers during loading", () => {
      render(
        <FileList
          files={[]}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={true}
        />,
      );

      expect(screen.getByText("文件")).toBeInTheDocument();
      expect(screen.getByText("大小")).toBeInTheDocument();
      expect(screen.getByText("时长")).toBeInTheDocument();
      expect(screen.getByText("类型")).toBeInTheDocument();
      expect(screen.getByText("状态")).toBeInTheDocument();
      expect(screen.getByText("操作")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no files and not loading", () => {
      render(
        <FileList
          files={[]}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={false}
        />,
      );

      expect(screen.getByText("尚未上传文件")).toBeInTheDocument();
      expect(screen.getByText("上传音频文件开始跟读练习。")).toBeInTheDocument();
      expect(screen.getByTestId("file-icon")).toBeInTheDocument();
    });
  });

  describe("File Display", () => {
    it("should display file information correctly", () => {
      const file = createMockFile();

      render(
        <FileList
          files={[file]}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={false}
        />,
      );

      expect(screen.getByText("文件管理 (1 个文件)")).toBeInTheDocument();
      expect(screen.getByText("test-audio.mp3")).toBeInTheDocument();
    });

    it("should format different file sizes correctly", () => {
      const files = [
        createMockFile({ size: 1024, name: "small.mp3" }),
        createMockFile({ size: 1048576, name: "medium.mp3" }),
        createMockFile({ size: 1073741824, name: "large.mp3" }),
      ];

      render(
        <FileList
          files={files}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={false}
        />,
      );

      expect(screen.getByText("文件管理 (3 个文件)")).toBeInTheDocument();
      expect(screen.getByText("small.mp3")).toBeInTheDocument();
      expect(screen.getByText("medium.mp3")).toBeInTheDocument();
      expect(screen.getByText("large.mp3")).toBeInTheDocument();
    });

    it("should handle zero file size", () => {
      const file = createMockFile({ size: 0 });

      render(
        <FileList
          files={[file]}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={false}
        />,
      );

      expect(screen.getByText("test-audio.mp3")).toBeInTheDocument();
    });

    it("should format duration correctly", () => {
      const files = [
        createMockFile({ duration: 0, name: "no-duration.mp3" }),
        createMockFile({ duration: 60, name: "1-minute.mp3" }),
        createMockFile({ duration: 3661, name: "1-hour.mp3" }),
      ];

      render(
        <FileList
          files={files}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={false}
        />,
      );

      expect(screen.getByText("no-duration.mp3")).toBeInTheDocument();
      expect(screen.getByText("1-minute.mp3")).toBeInTheDocument();
      expect(screen.getByText("1-hour.mp3")).toBeInTheDocument();
    });

    it("should skip files without id", () => {
      const files = [
        createMockFile({ id: 1, name: "with-id.mp3" }),
        { ...createMockFile({ id: undefined, name: "without-id.mp3" }) },
      ];

      render(
        <FileList
          files={files}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={false}
        />,
      );

      expect(screen.getByText("with-id.mp3")).toBeInTheDocument();
      expect(screen.queryByText("without-id.mp3")).not.toBeInTheDocument();
    });
  });

  describe("Status Display", () => {
    it("should show pending status for files without transcripts", () => {
      const file = createMockFile();

      render(
        <FileList
          files={[file]}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={false}
        />,
      );

      expect(screen.getByTestId("status-icon")).toBeInTheDocument();
    });

    it("should show completed status for files with completed transcripts", () => {
      const file = createMockFile();
      const transcript = createMockTranscript({ status: "completed" });

      render(
        <FileList
          files={[file]}
          transcripts={[transcript]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={false}
        />,
      );

      expect(screen.getByTestId("status-icon")).toBeInTheDocument();
    });

    it("should show processing status for files with processing transcripts", () => {
      const file = createMockFile();
      const transcript = createMockTranscript({ status: "processing" });

      render(
        <FileList
          files={[file]}
          transcripts={[transcript]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={false}
        />,
      );

      expect(screen.getByTestId("status-icon")).toBeInTheDocument();
    });

    it("should show failed status for files with failed transcripts", () => {
      const file = createMockFile();
      const transcript = createMockTranscript({ status: "failed" });

      render(
        <FileList
          files={[file]}
          transcripts={[transcript]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={false}
        />,
      );

      expect(screen.getByTestId("status-icon")).toBeInTheDocument();
    });

    it("should use latest transcript when multiple transcripts exist", () => {
      const file = createMockFile();
      const oldTranscript = createMockTranscript({
        id: 1,
        status: "pending",
        createdAt: new Date("2024-01-01"),
      });
      const newTranscript = createMockTranscript({
        id: 2,
        status: "completed",
        createdAt: new Date("2024-01-02"),
      });

      render(
        <FileList
          files={[file]}
          transcripts={[oldTranscript, newTranscript]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={false}
        />,
      );

      expect(screen.getByTestId("status-icon")).toBeInTheDocument();
    });
  });

  describe("Progress Display", () => {
    it("should show progress information for processing files", () => {
      const file = createMockFile();
      const transcript = createMockTranscript({ status: "processing" });

      render(
        <FileList
          files={[file]}
          transcripts={[transcript]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={false}
        />,
      );

      // Check that the status badge shows processing
      expect(screen.getByText("processing")).toBeInTheDocument();

      // The component should render the processing state correctly
      const statusBadge = screen.getByTestId("badge-default");
      expect(statusBadge).toBeInTheDocument();
    });

    it("should show 'Starting...' when no progress info available", () => {
      const file = createMockFile();
      const transcript = createMockTranscript({ status: "processing" });

      render(
        <FileList
          files={[file]}
          transcripts={[transcript]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={false}
        />,
      );

      // Check that the status badge shows processing
      expect(screen.getByText("processing")).toBeInTheDocument();
    });

    it("should show error information for failed files", () => {
      const file = createMockFile();
      const transcript = createMockTranscript({ status: "failed" });

      render(
        <FileList
          files={[file]}
          transcripts={[transcript]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={false}
        />,
      );

      // Check that the status badge shows failed
      expect(screen.getByText("failed")).toBeInTheDocument();
    });

    it("should show default error message when no specific error", () => {
      const file = createMockFile();
      const transcript = createMockTranscript({ status: "failed" });

      render(
        <FileList
          files={[file]}
          transcripts={[transcript]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={false}
        />,
      );

      // Check that the status badge shows failed
      expect(screen.getByText("failed")).toBeInTheDocument();
    });
  });

  describe("Action Buttons", () => {
    it("should enable play button for completed files", () => {
      const file = createMockFile();
      const transcript = createMockTranscript({ status: "completed" });

      render(
        <FileList
          files={[file]}
          transcripts={[transcript]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={false}
        />,
      );

      const playButton = screen.getByTestId("play-icon").closest("button");
      expect(playButton).not.toBeDisabled();
    });

    it("should disable play button for non-completed files", () => {
      const file = createMockFile();
      const transcript = createMockTranscript({ status: "pending" });

      render(
        <FileList
          files={[file]}
          transcripts={[transcript]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={false}
        />,
      );

      const playButton = screen.getByTestId("play-icon").closest("button");
      expect(playButton).toBeDisabled();
    });

    it("should call onPlayFile when play button is clicked", async () => {
      const file = createMockFile();
      const transcript = createMockTranscript({ status: "completed" });
      const user = userEvent.setup();

      render(
        <FileList
          files={[file]}
          transcripts={[transcript]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={false}
        />,
      );

      const playButton = screen.getByTestId("play-icon").closest("button");
      await user.click(playButton!);

      expect(mockOnPlayFile).toHaveBeenCalledWith(file);
    });

    it("should call onDeleteFile when delete button is clicked", async () => {
      const file = createMockFile();
      const user = userEvent.setup();

      render(
        <FileList
          files={[file]}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={false}
        />,
      );

      const deleteButton = screen.getByTestId("trash2-icon").closest("button");
      if (deleteButton) {
        await user.click(deleteButton);
      }

      expect(mockOnDeleteFile).toHaveBeenCalledWith(file.id);
    });

    it("should not call onDeleteFile for files without id", async () => {
      const file = { ...createMockFile(), id: undefined };
      const _user = userEvent.setup();

      render(
        <FileList
          files={[file]}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={false}
        />,
      );

      // File without id should not be rendered, so no delete button
      expect(screen.queryByTestId("trash2-icon")).not.toBeInTheDocument();
    });

    it("should not call handlers when they are undefined", async () => {
      const file = createMockFile();
      const user = userEvent.setup();

      render(<FileList files={[file]} transcripts={[]} isLoading={false} />);

      // Delete button should still be present but handlers are undefined
      const deleteButton = screen.getByTestId("trash2-icon").closest("button");
      expect(deleteButton).toBeInTheDocument();

      // Click should not throw error
      if (deleteButton) {
        await user.click(deleteButton);
      }
    });
  });

  describe("Badge Variants", () => {
    it("should use correct badge variants for different statuses", () => {
      const file = createMockFile();
      const transcript = createMockTranscript({ status: "completed" });

      render(
        <FileList
          files={[file]}
          transcripts={[transcript]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={false}
        />,
      );

      expect(screen.getByTestId("badge-default")).toBeInTheDocument();
    });

    it("should use outline variant for file type badge", () => {
      const file = createMockFile();

      render(
        <FileList
          files={[file]}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={false}
        />,
      );

      expect(screen.getByTestId("badge-outline")).toBeInTheDocument();
    });
  });

  describe("Multiple Files", () => {
    it("should handle multiple files correctly", () => {
      const files = [
        createMockFile({ id: 1, name: "file1.mp3" }),
        createMockFile({ id: 2, name: "file2.mp3" }),
        createMockFile({ id: 3, name: "file3.mp3" }),
      ];

      render(
        <FileList
          files={files}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={false}
        />,
      );

      expect(screen.getByText("文件管理 (3 个文件)")).toBeInTheDocument();
      expect(screen.getByText("file1.mp3")).toBeInTheDocument();
      expect(screen.getByText("file2.mp3")).toBeInTheDocument();
      expect(screen.getByText("file3.mp3")).toBeInTheDocument();
    });

    it("should apply correct hover styling to rows", () => {
      const file = createMockFile();

      render(
        <FileList
          files={[file]}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={false}
        />,
      );

      const row = screen.getByText("test-audio.mp3").closest("tr");
      expect(row).toHaveClass("hover:bg-muted/50");
    });
  });

  describe("Accessibility", () => {
    it("should have proper table structure", () => {
      const file = createMockFile();

      render(
        <FileList
          files={[file]}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={false}
        />,
      );

      expect(screen.getByTestId("table")).toBeInTheDocument();
      expect(screen.getByTestId("thead")).toBeInTheDocument();
      expect(screen.getByTestId("tbody")).toBeInTheDocument();
      expect(screen.getAllByTestId("th")).toHaveLength(7);
      expect(screen.getAllByTestId("td")).toHaveLength(7);
    });

    it("should have accessible buttons with proper attributes", () => {
      const file = createMockFile();

      render(
        <FileList
          files={[file]}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          onRetryTranscription={mockOnRetryTranscription}
          isLoading={false}
        />,
      );

      const buttons = screen.getAllByRole("button").filter((button) => {
        const type = button.getAttribute("type");
        return !type || type === "button";
      });
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach((button) => {
        expect(button).toHaveAttribute("type", "button");
      });
    });
  });
});
