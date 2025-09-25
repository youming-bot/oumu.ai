import { render } from "@testing-library/react";

// 创建最简单的模拟
jest.mock("@/components/ui/badge", () => ({
  __esModule: true,
  default: () => <div data-testid="badge">Badge</div>,
}));

jest.mock("@/components/ui/button", () => ({
  __esModule: true,
  default: () => <button data-testid="button">Button</button>,
}));

jest.mock("@/components/ui/card", () => ({
  __esModule: true,
  default: () => <div data-testid="card">Card</div>,
}));

jest.mock("@/components/ui/input", () => ({
  __esModule: true,
  default: () => <input data-testid="input" />,
}));

jest.mock("@/components/ui/skeleton", () => ({
  __esModule: true,
  default: () => <div data-testid="skeleton">Skeleton</div>,
}));

jest.mock("@/components/ui/table", () => ({
  __esModule: true,
  Table: ({ children }) => <table data-testid="table">{children}</table>,
  TableBody: ({ children }) => <tbody data-testid="tbody">{children}</tbody>,
  TableCell: ({ children }) => <td data-testid="td">{children}</td>,
  TableHead: ({ children }) => <th data-testid="th">{children}</th>,
  TableHeader: ({ children }) => <thead data-testid="thead">{children}</thead>,
  TableRow: ({ children }) => <tr data-testid="tr">{children}</tr>,
}));

jest.mock("@/components/ui/tooltip", () => ({
  __esModule: true,
  TooltipProvider: ({ children }) => <div data-testid="tooltip-provider">{children}</div>,
  Tooltip: ({ children }) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children }) => <div data-testid="tooltip-trigger">{children}</div>,
  TooltipContent: ({ children }) => <div data-testid="tooltip-content">{children}</div>,
}));

jest.mock("lucide-react", () => ({
  File: () => <div data-testid="file-icon">File</div>,
  Play: () => <div data-testid="play-icon">Play</div>,
  Trash2: () => <div data-testid="trash-icon">Trash2</div>,
  Square: () => <div data-testid="square-icon">Square</div>,
  Filter: () => <div data-testid="filter-icon">Filter</div>,
}));

jest.mock("@/hooks/useFileFormatting", () => ({
  __esModule: true,
  useFileFormatting: () => ({
    formatFileSize: () => "1MB",
    formatDuration: () => "5:00",
    getStatusIcon: () => <div data-testid="status-icon">Icon</div>,
    getStatusVariant: () => "default",
    getStatusText: () => "Status",
  }),
}));

jest.mock("@/hooks/useFileList", () => ({
  __esModule: true,
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
  __esModule: true,
  cn: () => "cn",
}));

// 导入组件
import FileList from "../../../src/components/file-list";

describe("FileList Simple Test", () => {
  test("should render empty state without crashing", () => {
    expect(() => {
      render(<FileList files={[]} transcripts={[]} />);
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
      render(<FileList files={[mockFile]} transcripts={[]} />);
    }).not.toThrow();
  });
});
