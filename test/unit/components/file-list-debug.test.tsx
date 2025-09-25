import { render, screen } from "@testing-library/react";
import React from "react";
import type { FileRow } from "../../../src/types/database";

// Mock all dependencies
jest.mock("lucide-react", () => ({
  File: () => <div data-testid="file-icon" />,
  Play: () => <div data-testid="play-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Square: () => <div data-testid="square-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
}));

jest.mock("@/components/ui/badge", () => ({
  __esModule: true,
  default: ({ children, variant, className }) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

jest.mock("@/components/ui/button", () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, variant, size, className }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
      data-size={size}
      data-testid="mock-button"
    >
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/card", () => ({
  __esModule: true,
  default: ({ children, className }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
}));

jest.mock("@/components/ui/input", () => ({
  __esModule: true,
  default: ({ className, placeholder, onChange, ...props }) => (
    <input
      className={className}
      placeholder={placeholder}
      onChange={onChange}
      data-testid="input"
      {...props}
    />
  ),
}));

jest.mock("@/components/ui/skeleton", () => ({
  __esModule: true,
  default: ({ className }) => (
    <div data-testid="skeleton" className={className}>
      Loading...
    </div>
  ),
}));

jest.mock("@/components/ui/table", () => ({
  __esModule: true,
  Table: ({ children, ...props }) => (
    <table data-testid="table" {...props}>
      {children}
    </table>
  ),
  TableBody: ({ children, ...props }) => (
    <tbody data-testid="table-body" {...props}>
      {children}
    </tbody>
  ),
  TableCell: ({ children, ...props }) => (
    <td data-testid="table-cell" {...props}>
      {children}
    </td>
  ),
  TableHead: ({ children, ...props }) => (
    <th data-testid="table-head" {...props}>
      {children}
    </th>
  ),
  TableHeader: ({ children, ...props }) => (
    <thead data-testid="table-header" {...props}>
      {children}
    </thead>
  ),
  TableRow: ({ children, ...props }) => (
    <tr data-testid="table-row" {...props}>
      {children}
    </tr>
  ),
}));

jest.mock("@/components/ui/tooltip", () => ({
  __esModule: true,
  TooltipProvider: ({ children }) => <div data-testid="tooltip-provider">{children}</div>,
  Tooltip: ({ children }) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children, asChild, ...props }) => (
    <div data-testid="tooltip-trigger" {...props}>
      {children}
    </div>
  ),
  TooltipContent: ({ children }) => <div data-testid="tooltip-content">{children}</div>,
}));

jest.mock("@/hooks/useFileFormatting", () => ({
  __esModule: true,
  useFileFormatting: () => ({
    formatFileSize: jest.fn((bytes) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
    }),
    formatDuration: jest.fn((seconds) => {
      if (!seconds) return "--:--";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }),
    getStatusIcon: jest.fn((status) => {
      return React.createElement("div", { "data-testid": `${status}-icon` }, status);
    }),
    getStatusVariant: jest.fn((status) => {
      const variantMap = {
        pending: "outline",
        processing: "default",
        completed: "default",
        failed: "destructive",
      };
      return variantMap[status] || "outline";
    }),
    getStatusText: jest.fn((status) => {
      const textMap = {
        pending: "待处理",
        processing: "处理中",
        completed: "已完成",
        failed: "失败",
      };
      return textMap[status] || "未知";
    }),
  }),
}));

jest.mock("@/hooks/useFileList", () => ({
  __esModule: true,
  useFileList: ({ files, transcripts }) => ({
    transcriptStatusMap: new Map(),
    statusFilter: "all",
    setStatusFilter: jest.fn(),
    getTranscriptStatus: jest.fn((_fileId) => "pending"),
    filteredFiles: Array.isArray(files) ? files : [],
    searchTerm: "",
    setSearchTerm: jest.fn(),
    filteredAndSearchedFiles: Array.isArray(files) ? files : [],
    selectedFiles: new Set(),
    setSelectedFiles: jest.fn(),
    searchQuery: "",
    sortBy: "name",
    sortOrder: "asc",
    filteredAndSortedFiles: Array.isArray(files) ? files : [],
    handleSelectAll: jest.fn(),
    handleSelectFile: jest.fn(),
    handleSort: jest.fn(),
    setSearchQuery: jest.fn(),
  }),
}));

jest.mock("@/lib/utils", () => ({
  __esModule: true,
  cn: jest.fn((...classes) => classes.filter(Boolean).join(" ")),
}));

// Import the actual component for testing AFTER all mocks are set up
import FileList from "../../../src/components/file-list";

describe("FileList Debug Test", () => {
  const mockOnPlayFile = jest.fn();
  const mockOnDeleteFile = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockFile = (overrides: any = {}): FileRow => ({
    id: 1,
    name: "test-audio.mp3",
    size: 1024 * 1024 * 5, // 5MB
    type: "audio/mp3",
    blob: new Blob(["audio data"]),
    duration: 180, // 3 minutes
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  });

  test("should render with minimal props", () => {
    const file = createMockFile();

    expect(() => {
      render(
        <FileList
          files={[file]}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />,
      );
    }).not.toThrow();
  });

  test("should display file information correctly", () => {
    const file = createMockFile({
      name: "japanese-lesson.mp3",
      size: 2 * 1024 * 1024, // 2MB
      type: "audio/mp3",
      duration: 240, // 4 minutes
    });

    render(
      <FileList
        files={[file]}
        transcripts={[]}
        onPlayFile={mockOnPlayFile}
        onDeleteFile={mockOnDeleteFile}
      />,
    );

    // Basic check to see if anything renders
    expect(screen.getByTestId("table")).toBeInTheDocument();
  });
});
