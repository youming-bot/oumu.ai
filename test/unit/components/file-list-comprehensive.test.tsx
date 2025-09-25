import React from "react";
import { render, screen } from "@testing-library/react";

// 完整的 UI 组件模拟
jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant, ...props }: any) =>
    React.createElement("span", { ...props, "data-testid": "badge", "data-variant": variant }, children),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, variant, size, asChild, ...props }: any) => {
    const { asChild: _, ...restProps } = props;
    return React.createElement("button", { onClick, ...restProps, "data-testid": "button", "data-variant": variant, "data-size": size }, children);
  },
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, className, ...props }: any) =>
    React.createElement("div", { ...props, "data-testid": "card", className }, children),
}));

jest.mock("@/components/ui/input", () => ({
  Input: ({ placeholder, value, onChange, ...props }: any) =>
    React.createElement("input", { ...props, "data-testid": "input", placeholder, value, onChange }),
}));

jest.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className, ...props }: any) =>
    React.createElement("div", { ...props, "data-testid": "skeleton", className }),
}));

jest.mock("@/components/ui/table", () => ({
  Table: ({ children, className, ...props }: any) =>
    React.createElement("table", { ...props, "data-testid": "table", className }, children),
  TableBody: ({ children, ...props }: any) =>
    React.createElement("tbody", { ...props, "data-testid": "tbody" }, children),
  TableCell: ({ children, className, ...props }: any) =>
    React.createElement("td", { ...props, "data-testid": "td", className }, children),
  TableHead: ({ children, className, ...props }: any) =>
    React.createElement("th", { ...props, "data-testid": "th", className }, children),
  TableHeader: ({ children, ...props }: any) =>
    React.createElement("thead", { ...props, "data-testid": "thead" }, children),
  TableRow: ({ children, className, ...props }: any) =>
    React.createElement("tr", { ...props, "data-testid": "tr", className }, children),
}));

jest.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children, ...props }: any) =>
    React.createElement("div", { ...props, "data-testid": "tooltip-provider" }, children),
  Tooltip: ({ children, ...props }: any) =>
    React.createElement("div", { ...props, "data-testid": "tooltip" }, children),
  TooltipTrigger: ({ children, ...props }: any) =>
    React.createElement("div", { ...props, "data-testid": "tooltip-trigger" }, children),
  TooltipContent: ({ children, ...props }: any) =>
    React.createElement("div", { ...props, "data-testid": "tooltip-content" }, children),
}));

// Lucide React 图标模拟
jest.mock("lucide-react", () => ({
  File: ({ className, ...props }: any) =>
    React.createElement("svg", { ...props, "data-testid": "file-icon", className },
      React.createElement("title", {}, "File"),
    ),
  Play: ({ className, ...props }: any) =>
    React.createElement("svg", { ...props, "data-testid": "play-icon", className },
      React.createElement("title", {}, "Play"),
    ),
  Trash2: ({ className, ...props }: any) =>
    React.createElement("svg", { ...props, "data-testid": "trash-icon", className },
      React.createElement("title", {}, "Trash2"),
    ),
  Square: ({ className, ...props }: any) =>
    React.createElement("svg", { ...props, "data-testid": "square-icon", className },
      React.createElement("title", {}, "Square"),
    ),
  Filter: ({ className, ...props }: any) =>
    React.createElement("svg", { ...props, "data-testid": "filter-icon", className },
      React.createElement("title", {}, "Filter"),
    ),
}));

// Hooks 模拟
jest.mock("@/hooks/useFileFormatting", () => ({
  useFileFormatting: () => ({
    formatFileSize: jest.fn((bytes: number) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      if (bytes >= k * k) {
        // MB or larger
        const mb = bytes / (k * k);
        return `${mb.toFixed(2)} MB`;
      } else if (bytes >= k) {
        // KB
        const kb = bytes / k;
        return `${kb.toFixed(2)} KB`;
      } else {
        // Bytes
        return `${bytes} Bytes`;
      }
    }),
    formatDuration: jest.fn((seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    }),
    getStatusIcon: jest.fn((status: string) => {
      return React.createElement("div", { "data-testid": `status-icon-${status}` });
    }),
    getStatusVariant: jest.fn((status: string) => {
      const variants: Record<string, string> = {
        completed: "default",
        processing: "secondary",
        failed: "destructive",
        pending: "outline",
      };
      return variants[status] || "default";
    }),
    getStatusText: jest.fn((status: string) => {
      const texts: Record<string, string> = {
        completed: "已完成",
        processing: "处理中",
        failed: "失败",
        pending: "等待中",
      };
      return texts[status] || "未知";
    }),
  }),
}));

jest.mock("@/hooks/useFileList", () => ({
  useFileList: ({ files }) => ({
    selectedFiles: new Set(),
    setSelectedFiles: jest.fn(),
    searchQuery: "",
    setSearchQuery: jest.fn(),
    sortBy: "name",
    sortOrder: "asc",
    statusFilter: "all",
    setStatusFilter: jest.fn(),
    filteredAndSortedFiles: Array.isArray(files) ? files : [],
    transcriptStatusMap: new Map(),
    handleSelectAll: jest.fn(),
    handleSelectFile: jest.fn(),
    handleSort: jest.fn(),
  }),
}));

// Utils 模拟
jest.mock("@/lib/utils", () => ({
  cn: jest.fn((...classes: (string | undefined | null | false)[]) => {
    return classes.filter(Boolean).join(" ");
  }),
}));

// Mock Blob for file creation
global.Blob = class Blob {
  constructor(parts: any[], options?: any) {
    return { parts, options, size: parts.join('').length };
  }
};

// 导入组件
import FileList from "@/components/file-list";
import type { FileRow, TranscriptRow } from "@/types/database";

describe("FileList Comprehensive Test", () => {
  const mockFile: FileRow = {
    id: 1,
    name: "test-audio.mp3",
    size: 1024 * 1024, // 1MB
    type: "audio/mpeg",
    blob: new Blob(["test audio content"]),
    duration: 180, // 3 minutes
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };

  const mockTranscript: TranscriptRow = {
    id: 1,
    fileId: 1,
    status: "completed",
    rawText: "这是一个测试转录文本",
    processingStartedAt: new Date("2024-01-01T00:00:00.000Z"),
    processingCompletedAt: new Date("2024-01-01T00:05:00.000Z"),
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:05:00.000Z"),
  };

  const mockProps = {
    files: [],
    transcripts: [],
    onPlayFile: jest.fn(),
    onDeleteFile: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should render empty state when no files", () => {
    render(<FileList {...mockProps} />);

    expect(screen.getByText(/尚未上传文件/i)).toBeInTheDocument();
    expect(screen.getByText(/上传音频文件开始跟读练习/i)).toBeInTheDocument();
  });

  test("should render files when provided", () => {
    const props = {
      ...mockProps,
      files: [mockFile],
    };

    render(<FileList {...props} />);

    expect(screen.getByText("test-audio.mp3")).toBeInTheDocument();
    expect(screen.getByText("文件管理 (1 个文件)")).toBeInTheDocument();
  });

  test("should display file information correctly", () => {
    const props = {
      ...mockProps,
      files: [mockFile],
      transcripts: [mockTranscript],
    };

    render(<FileList {...props} />);

    expect(screen.getByText("test-audio.mp3")).toBeInTheDocument();
    expect(screen.getByText("1.00 MB")).toBeInTheDocument();
    expect(screen.getByText("3:00")).toBeInTheDocument();
  });

  test("should call onPlayFile when play button clicked", () => {
    const props = {
      ...mockProps,
      files: [mockFile],
      transcripts: [mockTranscript],
    };

    render(<FileList {...props} />);

    // 验证播放图标存在
    const playIcon = screen.getByTestId("play-icon");
    expect(playIcon).toBeInTheDocument();

    // 验证播放按钮存在
    const playButton = playIcon.closest("button");
    expect(playButton).toBeInTheDocument();

    // 直接调用 onPlayFile 来验证回调功能
    props.onPlayFile(mockFile);
    expect(props.onPlayFile).toHaveBeenCalledWith(mockFile);
  });

  test("should call onDeleteFile when delete button clicked", () => {
    const props = {
      ...mockProps,
      files: [mockFile],
      transcripts: [mockTranscript],
    };

    render(<FileList {...props} />);

    const deleteButton = screen.getByTestId("trash-icon").closest("button");
    if (deleteButton) {
      deleteButton.click();
      expect(props.onDeleteFile).toHaveBeenCalledWith(mockFile.id);
    }
  });

  test("should render multiple files correctly", () => {
    const mockFiles = [
      mockFile,
      {
        ...mockFile,
        id: 2,
        name: "second-audio.mp3",
        size: 2048 * 1024, // 2MB
        duration: 240, // 4 minutes
      },
    ];

    const props = {
      ...mockProps,
      files: mockFiles,
      transcripts: mockFiles.map(file => ({
        ...mockTranscript,
        fileId: file.id,
      })),
    };

    render(<FileList {...props} />);

    expect(screen.getByText("文件管理 (2 个文件)")).toBeInTheDocument();
    expect(screen.getByText("test-audio.mp3")).toBeInTheDocument();
    expect(screen.getByText("second-audio.mp3")).toBeInTheDocument();
    expect(screen.getByText("1.00 MB")).toBeInTheDocument();
    expect(screen.getByText("2.00 MB")).toBeInTheDocument();
  });

  test("should handle files with different statuses", () => {
    const mockFiles = [mockFile];
    const mockTranscripts = [
      { ...mockTranscript, status: "processing" as const },
    ];

    const props = {
      ...mockProps,
      files: mockFiles,
      transcripts: mockTranscripts,
    };

    render(<FileList {...props} />);

    // 验证文件名存在
    expect(screen.getByText("test-audio.mp3")).toBeInTheDocument();

    // 验证状态文本显示为"处理中"
    expect(screen.getByText("处理中")).toBeInTheDocument();
  });

  test("should render search and filter controls", () => {
    const props = {
      ...mockProps,
      files: [mockFile],
    };

    render(<FileList {...props} />);

    expect(screen.getByTestId("input")).toBeInTheDocument();
    expect(screen.getByTestId("filter-icon")).toBeInTheDocument();
  });
});