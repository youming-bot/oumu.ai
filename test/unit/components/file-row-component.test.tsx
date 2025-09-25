import { render } from "@testing-library/react";

// Mock all dependencies
jest.mock("@/components/ui/badge", () => ({
  __esModule: true,
  default: ({ children, variant }) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}));

jest.mock("@/components/ui/button", () => ({
  __esModule: true,
  default: ({ children, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} data-testid="button">
      {children}
    </button>
  ),
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

// Import the FileList component which contains FileRowComponent
import FileList from "../../../src/components/file-list";

describe("FileRowComponent Test", () => {
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

  test("should render FileRowComponent through FileList", () => {
    // Create a mock useFileList that returns a file
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
        filteredAndSortedFiles: [mockFile],
        transcriptStatusMap: new Map([[1, "pending"]]),
        handleSelectAll: jest.fn(),
        handleSelectFile: jest.fn(),
        handleSort: jest.fn(),
      }),
    }));

    expect(() => {
      render(<FileList files={[mockFile]} transcripts={[]} />);
    }).not.toThrow();
  });
});
