import React from "react";
import { render } from "@testing-library/react";

// 创建最简单的模拟
jest.mock("@/components/ui/badge", () => ({
  Badge: () => React.createElement("div", { "data-testid": "badge" }, "Badge"),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) =>
    React.createElement("button", { onClick, ...props, "data-testid": "button" }, children),
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: any) =>
    React.createElement("div", { ...props, "data-testid": "card" }, children),
}));

jest.mock("@/components/ui/input", () => ({
  Input: (props: any) => React.createElement("input", { ...props, "data-testid": "input" }),
}));

jest.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => React.createElement("div", { "data-testid": "skeleton" }, "Skeleton"),
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
  TooltipProvider: ({ children, ...props }: any) => React.createElement("div", { ...props, "data-testid": "tooltip-provider" }, children),
  Tooltip: ({ children, ...props }: any) => React.createElement("div", { ...props, "data-testid": "tooltip" }, children),
  TooltipTrigger: ({ children, ...props }: any) => React.createElement("div", { ...props, "data-testid": "tooltip-trigger" }, children),
  TooltipContent: ({ children, ...props }: any) => React.createElement("div", { ...props, "data-testid": "tooltip-content" }, children),
}));

jest.mock("lucide-react", () => ({
  File: () => React.createElement("div", { "data-testid": "file-icon" }, "File"),
  Play: () => React.createElement("div", { "data-testid": "play-icon" }, "Play"),
  Trash2: () => React.createElement("div", { "data-testid": "trash-icon" }, "Trash2"),
  Square: () => React.createElement("div", { "data-testid": "square-icon" }, "Square"),
  Filter: () => React.createElement("div", { "data-testid": "filter-icon" }, "Filter"),
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
  useFileList: () => ({
    selectedFiles: new Set(),
    setSelectedFiles: jest.fn(),
    searchQuery: "",
    setSearchQuery: jest.fn(),
    sortBy: "name",
    sortOrder: "asc",
    statusFilter: "all",
    setStatusFilter: jest.fn(),
    filteredAndSortedFiles: [],
    transcriptStatusMap: new Map(),
    handleSelectAll: jest.fn(),
    handleSelectFile: jest.fn(),
    handleSort: jest.fn(),
  }),
}));

jest.mock("@/lib/utils", () => ({
  cn: jest.fn((...args: any[]) => args.filter(Boolean).join(" ")),
}));

// Mock Blob for file creation
global.Blob = class Blob {
  constructor(parts: any[], options?: any) {
    return { parts, options, size: parts.join('').length };
  }
};

// 导入组件
import FileList from "@/components/file-list";

describe("FileList Simple Test", () => {
  test("should render empty state without crashing", () => {
    expect(() => {
      render(
        <FileList
          files={[]}
          transcripts={[]}
          onPlayFile={jest.fn()}
          onDeleteFile={jest.fn()}
        />
      );
    }).not.toThrow();
  });

  test("should render with one file without crashing", () => {
    const mockFile = {
      id: 1,
      name: "test.mp3",
      size: 1024,
      type: "audio/mp3",
      blob: new Blob(["test"]),
      duration: 60,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(() => {
      render(
        <FileList
          files={[mockFile]}
          transcripts={[]}
          onPlayFile={jest.fn()}
          onDeleteFile={jest.fn()}
        />
      );
    }).not.toThrow();
  });

  test("should render with multiple files without crashing", () => {
    const mockFiles = [
      {
        id: 1,
        name: "test1.mp3",
        size: 1024,
        type: "audio/mp3",
        blob: new Blob(["test"]),
        duration: 60,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: "test2.mp3",
        size: 2048,
        type: "audio/mp3",
        blob: new Blob(["test"]),
        duration: 120,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    expect(() => {
      render(
        <FileList
          files={mockFiles}
          transcripts={[]}
          onPlayFile={jest.fn()}
          onDeleteFile={jest.fn()}
        />
      );
    }).not.toThrow();
  });
});