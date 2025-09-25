import React from "react";
import { render } from "@testing-library/react";

// Mock all dependencies with minimal implementations
jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: any) => React.createElement("span", { ...props, "data-testid": "badge" }, children),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => React.createElement("button", { ...props, "data-testid": "button" }, children),
}));

jest.mock("@/components/ui/table", () => ({
  Table: ({ children, ...props }: any) => React.createElement("table", { ...props, "data-testid": "table" }, children),
  TableBody: ({ children, ...props }: any) => React.createElement("tbody", { ...props, "data-testid": "tbody" }, children),
  TableCell: ({ children, ...props }: any) => React.createElement("td", { ...props, "data-testid": "td" }, children),
  TableHead: ({ children, ...props }: any) => React.createElement("th", { ...props, "data-testid": "th" }, children),
  TableHeader: ({ children, ...props }: any) => React.createElement("thead", { ...props, "data-testid": "thead" }, children),
  TableRow: ({ children, ...props }: any) => React.createElement("tr", { ...props, "data-testid": "tr" }, children),
}));

jest.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children, ...props }: any) => React.createElement("div", { ...props, "data-testid": "tooltip" }, children),
  TooltipContent: ({ children, ...props }: any) => React.createElement("div", { ...props, "data-testid": "tooltip-content" }, children),
  TooltipProvider: ({ children, ...props }: any) => React.createElement("div", { ...props, "data-testid": "tooltip-provider" }, children),
  TooltipTrigger: ({ children, ...props }: any) => React.createElement("div", { ...props, "data-testid": "tooltip-trigger" }, children),
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: any) => React.createElement("div", { ...props, "data-testid": "card" }, children),
}));

jest.mock("@/components/ui/input", () => ({
  Input: (props: any) => React.createElement("input", { ...props, "data-testid": "input" }),
}));

jest.mock("@/components/ui/skeleton", () => ({
  Skeleton: (props: any) => React.createElement("div", { ...props, "data-testid": "skeleton" }, "Loading..."),
}));

jest.mock("lucide-react", () => ({
  File: (props: any) => React.createElement("div", { ...props, "data-testid": "file-icon" }, "File"),
  Play: (props: any) => React.createElement("div", { ...props, "data-testid": "play-icon" }, "Play"),
  Trash2: (props: any) => React.createElement("div", { ...props, "data-testid": "trash-icon" }, "Trash2"),
  Clock: (props: any) => React.createElement("div", { ...props, "data-testid": "clock-icon" }, "Clock"),
  CheckCircle: (props: any) => React.createElement("div", { ...props, "data-testid": "check-circle-icon" }, "CheckCircle"),
  AlertCircle: (props: any) => React.createElement("div", { ...props, "data-testid": "alert-circle-icon" }, "AlertCircle"),
  Loader: (props: any) => React.createElement("div", { ...props, "data-testid": "loader-icon" }, "Loader"),
  Filter: (props: any) => React.createElement("div", { ...props, "data-testid": "filter-icon" }, "Filter"),
  Square: (props: any) => React.createElement("div", { ...props, "data-testid": "square-icon" }, "Square"),
}));

jest.mock("@/hooks/useFileFormatting", () => ({
  useFileFormatting: () => ({
    formatFileSize: jest.fn(() => "1MB"),
    formatDuration: jest.fn(() => "5:00"),
    getStatusIcon: jest.fn(() => React.createElement("div", { "data-testid": "status-icon" })),
    getStatusVariant: jest.fn(() => "default"),
    getStatusText: jest.fn(() => "Status"),
  }),
}));

jest.mock("@/hooks/useFileList", () => ({
  useFileList: ({ files }) => ({
    selectedFiles: new Set(),
    setSelectedFiles: jest.fn(),
    transcriptStatusMap: new Map(),
    statusFilter: "all",
    setStatusFilter: jest.fn(),
    searchQuery: "",
    setSearchQuery: jest.fn(),
    sortBy: "name",
    sortOrder: "asc",
    filteredAndSortedFiles: Array.isArray(files) ? files : [],
    handleSelectAll: jest.fn(),
    handleSelectFile: jest.fn(),
    handleSort: jest.fn(),
  }),
}));

jest.mock("@/lib/utils", () => ({
  cn: jest.fn(() => "cn"),
}));

// Mock Blob for file creation
global.Blob = class Blob {
  constructor(parts: any[], options?: any) {
    return { parts, options, size: parts.join('').length };
  }
};

// Import after mocks
import FileList from "@/components/file-list";
import type { FileRow, TranscriptRow } from "@/types/database";

describe("FileList Isolation Test", () => {
  test("component should be importable", () => {
    expect(() => {
      require("../../../src/components/file-list").default;
    }).not.toThrow();
  });

  test("should render without crashing with minimal props", () => {
    const mockFile: FileRow = {
      id: 1,
      name: "test.mp3",
      size: 1024 * 1024,
      type: "audio/mp3",
      duration: 330,
      blob: new Blob(["test content"]),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockTranscripts: TranscriptRow[] = [];

    expect(() => {
      render(React.createElement(FileList, { files: [mockFile], transcripts: mockTranscripts, isLoading: false }));
    }).not.toThrow();
  });

  test("should render loading state", () => {
    expect(() => {
      render(React.createElement(FileList, { files: [], transcripts: [], isLoading: true }));
    }).not.toThrow();
  });

  test("should render empty state", () => {
    expect(() => {
      render(React.createElement(FileList, { files: [], transcripts: [], isLoading: false }));
    }).not.toThrow();
  });
});
