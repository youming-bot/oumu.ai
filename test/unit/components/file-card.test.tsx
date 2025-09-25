import { render, screen } from "@testing-library/react";
import FileCard from "@/components/file-card";

// Mock the useFileFormatting hook
jest.mock("@/hooks/useFileFormatting");

describe("FileCard Component Tests", () => {
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

  const mockUseFileFormatting = require("@/hooks/useFileFormatting").useFileFormatting;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseFileFormatting.mockReturnValue({
      getStatusIcon: jest.fn(() => <div data-testid="status-icon" />),
      getStatusText: jest.fn((status: string) => status),
      formatFileSize: jest.fn((bytes: number) => `${bytes} KB`),
      formatDuration: jest.fn((seconds?: number) => `${seconds}s`),
    });
  });

  it("should show RefreshCw icon for retry button when status is failed", () => {
    render(<FileCard file={mockFile} status="failed" onRetryTranscription={jest.fn()} />);

    // Check that the component renders
    expect(screen.getByText("test.mp3")).toBeInTheDocument();
    expect(screen.getByText("failed")).toBeInTheDocument();
  });

  it("should show X icon for delete button", () => {
    render(<FileCard file={mockFile} status="pending" onDelete={jest.fn()} />);

    // Check that the component renders
    expect(screen.getByText("test.mp3")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("should show Play icon for completed files", () => {
    render(<FileCard file={mockFile} status="completed" onPlay={jest.fn()} />);

    // Check that the component renders
    expect(screen.getByText("test.mp3")).toBeInTheDocument();
    expect(screen.getByText("completed")).toBeInTheDocument();
  });
});
