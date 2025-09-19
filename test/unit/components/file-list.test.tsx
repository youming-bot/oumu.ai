import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FileRow, TranscriptRow } from '../../../src/types/database';

// Mock all dependencies BEFORE importing the component
jest.mock('@/components/ui/table', () => {
  const Table = ({ children, className }) => (
    <table className={className} data-testid="table">
      {children}
    </table>
  );
  const TableBody = ({ children, className }) => (
    <tbody className={className} data-testid="table-body">
      {children}
    </tbody>
  );
  const TableCell = ({ children, className }) => (
    <td className={className} data-testid="table-cell">
      {children}
    </td>
  );
  const TableHead = ({ children, className }) => (
    <th className={className} data-testid="table-head">
      {children}
    </th>
  );
  const TableHeader = ({ children }) => <thead data-testid="table-header">{children}</thead>;
  const TableRow = ({ children, className }) => (
    <tr className={className} data-testid="table-row">
      {children}
    </tr>
  );

  return {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  };
});

jest.mock('@/components/ui/button', () => {
  const MockButton = function MockButton({
    children,
    onClick,
    disabled,
    variant,
    size,
    className,
  }) {
    return (
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
    );
  };
  return MockButton;
});

jest.mock('@/components/ui/badge', () => {
  const MockBadge = function MockBadge({ children, variant, className }) {
    return (
      <span className={className} data-variant={variant} data-testid="mock-badge">
        {children}
      </span>
    );
  };
  return MockBadge;
});

jest.mock('@/components/ui/tooltip', () => {
  const TooltipProvider = ({ children }) => <div data-testid="tooltip-provider">{children}</div>;
  const Tooltip = ({ children }) => <div data-testid="tooltip">{children}</div>;
  const TooltipTrigger = ({ children, asChild }) => {
    // 当 asChild 为 true 时，直接返回子元素
    if (asChild) {
      return children;
    }
    return <div data-testid="tooltip-trigger">{children}</div>;
  };
  const TooltipContent = ({ children }) => <div data-testid="tooltip-content">{children}</div>;

  return {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
  };
});

jest.mock('@/components/ui/skeleton', () => {
  const MockSkeleton = function MockSkeleton({ className, ...props }) {
    return (
      <div
        className={className || 'animate-pulse rounded bg-gray-200'}
        data-testid="skeleton"
        {...props}
      >
        Loading...
      </div>
    );
  };
  return { Skeleton: MockSkeleton };
});

jest.mock('@/components/ui/card', () => {
  const MockCard = function MockCard({ children, className, ...props }) {
    return (
      <div className={className} data-testid="card" {...props}>
        {children}
      </div>
    );
  };
  return { Card: MockCard };
});

jest.mock('@/components/ui/input', () => {
  const MockInput = function MockInput({ className, placeholder, onChange, ...props }) {
    return (
      <input
        className={className}
        placeholder={placeholder}
        onChange={onChange}
        data-testid="input"
        {...props}
      />
    );
  };
  return { Input: MockInput };
});

jest.mock('lucide-react', () => ({
  File: () => <div data-testid="file-icon">File</div>,
  Play: () => <div data-testid="play-icon">Play</div>,
  Trash2: () => <div data-testid="trash-icon">Trash2</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
  AlertCircle: () => <div data-testid="alert-circle-icon">AlertCircle</div>,
  Loader: () => <div data-testid="loader-icon">Loader</div>,
  Download: () => <div data-testid="download-icon">Download</div>,
  Filter: () => <div data-testid="filter-icon">Filter</div>,
  Square: () => <div data-testid="square-icon">Square</div>,
  SortAsc: () => <div data-testid="sort-asc-icon">SortAsc</div>,
}));

jest.mock('@/lib/utils', () => ({
  cn: jest.fn((...inputs) => inputs.filter(Boolean).join(' ')),
  formatFileSize: jest.fn((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  }),
  formatDuration: jest.fn((seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }),
}));

// Import the actual component for testing AFTER all mocks are set up
import FileList from '../../../src/components/file-list';

describe('FileList Component', () => {
  const mockOnPlayFile = jest.fn();
  const mockOnDeleteFile = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockFile = (overrides: any = {}): FileRow => ({
    id: 1,
    name: 'test-audio.mp3',
    size: 1024 * 1024 * 5, // 5MB
    type: 'audio/mp3',
    blob: new Blob(['audio data']),
    duration: 180, // 3 minutes
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });

  const createMockTranscript = (overrides = {}): TranscriptRow => ({
    id: 1,
    fileId: 1,
    status: 'completed',
    rawText: 'Sample transcript text',
    language: 'ja',
    processingTime: 5000,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });

  describe('Loading State', () => {
    it('should show skeleton loading when isLoading is true', () => {
      render(
        <FileList
          files={[]}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          isLoading={true}
        />
      );

      expect(screen.getByText('Uploaded Files')).toBeInTheDocument();
      expect(screen.getAllByTestId('skeleton')).toHaveLength(24); // 3 rows × 8 skeletons per row (including actions)
    });

    it('should show table headers during loading', () => {
      render(
        <FileList
          files={[]}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          isLoading={true}
        />
      );

      expect(screen.getByText('File')).toBeInTheDocument();
      expect(screen.getByText('Size')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no files and not loading', () => {
      render(
        <FileList
          files={[]}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
          isLoading={false}
        />
      );

      expect(screen.getByText('No files uploaded')).toBeInTheDocument();
      expect(
        screen.getByText('Upload audio files to get started with shadowing practice.')
      ).toBeInTheDocument();
      expect(screen.getByTestId('file-icon')).toBeInTheDocument();
    });
  });

  describe('File Display', () => {
    it('should display file information correctly', () => {
      const file = createMockFile({
        name: 'japanese-lesson.mp3',
        size: 2 * 1024 * 1024, // 2MB
        type: 'audio/mp3',
        duration: 240, // 4 minutes
      });

      render(
        <FileList
          files={[file]}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />
      );

      expect(screen.getByText('japanese-lesson.mp3')).toBeInTheDocument();
      expect(screen.getByText('2.00 MB')).toBeInTheDocument();
      expect(screen.getByText('4:00')).toBeInTheDocument();
      expect(screen.getByText('audio/mp3')).toBeInTheDocument();
    });

    it('should format different file sizes correctly', () => {
      const files = [
        createMockFile({ id: 1, name: 'small.mp3', size: 512 }), // 512 bytes
        createMockFile({ id: 2, name: 'medium.mp3', size: 1024 * 512 }), // 512 KB
        createMockFile({ id: 3, name: 'large.mp3', size: 1024 * 1024 * 1.5 }), // 1.5 MB
        createMockFile({
          id: 4,
          name: 'huge.mp3',
          size: 1024 * 1024 * 1024 * 2.5,
        }), // 2.5 GB
      ];

      render(
        <FileList
          files={files}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />
      );

      expect(screen.getByText('512 Bytes')).toBeInTheDocument();
      expect(screen.getByText('512 KB')).toBeInTheDocument();
      expect(screen.getByText('1.50 MB')).toBeInTheDocument();
      expect(screen.getByText('2.50 GB')).toBeInTheDocument();
    });

    it('should handle zero file size', () => {
      const file = createMockFile({ size: 0 });

      render(
        <FileList
          files={[file]}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />
      );

      expect(screen.getByText('0 Bytes')).toBeInTheDocument();
    });

    it('should format duration correctly', () => {
      const files = [
        createMockFile({ id: 1, name: 'short.mp3', duration: 45 }),
        createMockFile({ id: 2, name: 'medium.mp3', duration: 125 }),
        createMockFile({ id: 3, name: 'long.mp3', duration: 3665 }),
        createMockFile({ id: 4, name: 'no-duration.mp3', duration: undefined }),
      ];

      render(
        <FileList
          files={files}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />
      );

      expect(screen.getByText('0:45')).toBeInTheDocument(); // 45 seconds
      expect(screen.getByText('2:05')).toBeInTheDocument(); // 125 seconds
      expect(screen.getByText('61:05')).toBeInTheDocument(); // 3665 seconds
      expect(screen.getByText('--:--')).toBeInTheDocument(); // undefined duration
    });

    it('should skip files without id', () => {
      const files = [
        createMockFile({ id: undefined, name: 'no-id.mp3' }),
        createMockFile({ id: 2, name: 'has-id.mp3' }),
      ];

      render(
        <FileList
          files={files}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />
      );

      expect(screen.queryByText('no-id.mp3')).not.toBeInTheDocument();
      expect(screen.getByText('has-id.mp3')).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('should show pending status for files without transcripts', () => {
      const file = createMockFile();

      render(
        <FileList
          files={[file]}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />
      );

      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    });

    it('should show completed status for files with completed transcripts', () => {
      const file = createMockFile();
      const transcript = createMockTranscript({ status: 'completed' });

      render(
        <FileList
          files={[file]}
          transcripts={[transcript]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />
      );

      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    it('should show processing status for files with processing transcripts', () => {
      const file = createMockFile();
      const transcript = createMockTranscript({ status: 'processing' });

      render(
        <FileList
          files={[file]}
          transcripts={[transcript]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />
      );

      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });

    it('should show failed status for files with failed transcripts', () => {
      const file = createMockFile();
      const transcript = createMockTranscript({ status: 'failed' });

      render(
        <FileList
          files={[file]}
          transcripts={[transcript]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />
      );

      expect(screen.getByText('Failed')).toBeInTheDocument();
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });

    it('should use latest transcript when multiple transcripts exist', () => {
      const file = createMockFile();
      const transcripts = [
        createMockTranscript({
          id: 1,
          status: 'failed',
          createdAt: new Date('2024-01-01'),
        }),
        createMockTranscript({
          id: 2,
          status: 'completed',
          createdAt: new Date('2024-01-02'),
        }),
      ];

      render(
        <FileList
          files={[file]}
          transcripts={transcripts}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />
      );

      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.queryByText('Failed')).not.toBeInTheDocument();
    });
  });

  describe('Progress Display', () => {
    it('should show progress information for processing files', () => {
      const file = createMockFile();
      const transcript = createMockTranscript({ status: 'processing' });
      const progressMap = new Map([[1, { progress: 65, status: 'processing' }]]);

      render(
        <FileList
          files={[file]}
          transcripts={[transcript]}
          transcriptionProgress={progressMap}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />
      );

      expect(screen.getByText('65%')).toBeInTheDocument();
    });

    it('should show "Starting..." when no progress info available', () => {
      const file = createMockFile();
      const transcript = createMockTranscript({ status: 'processing' });

      render(
        <FileList
          files={[file]}
          transcripts={[transcript]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />
      );

      expect(screen.getByText('Starting...')).toBeInTheDocument();
    });

    it('should show error information for failed files', () => {
      const file = createMockFile();
      const transcript = createMockTranscript({ status: 'failed' });
      const progressMap = new Map([
        [
          1,
          {
            progress: 0,
            status: 'failed',
            error: 'Network timeout',
          },
        ],
      ]);

      render(
        <FileList
          files={[file]}
          transcripts={[transcript]}
          transcriptionProgress={progressMap}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />
      );

      expect(screen.getByText('Error: Network timeout')).toBeInTheDocument();
    });

    it('should show default error message when no specific error', () => {
      const file = createMockFile();
      const transcript = createMockTranscript({ status: 'failed' });

      render(
        <FileList
          files={[file]}
          transcripts={[transcript]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />
      );

      expect(screen.getByText('Transcription failed')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should enable play button for completed files', () => {
      const file = createMockFile();
      const transcript = createMockTranscript({ status: 'completed' });

      render(
        <FileList
          files={[file]}
          transcripts={[transcript]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />
      );

      const playButton = screen.getByTestId('play-icon').closest('button');
      expect(playButton).not.toBeDisabled();
    });

    it('should disable play button for non-completed files', () => {
      const file = createMockFile();
      const transcript = createMockTranscript({ status: 'processing' });

      render(
        <FileList
          files={[file]}
          transcripts={[transcript]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />
      );

      const playButton = screen.getByTestId('play-icon').closest('button');
      expect(playButton).toBeDisabled();
    });

    it('should call onPlayFile when play button is clicked', async () => {
      const user = userEvent.setup();
      const file = createMockFile();
      const transcript = createMockTranscript({ status: 'completed' });

      render(
        <FileList
          files={[file]}
          transcripts={[transcript]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />
      );

      const playButton = screen.getByTestId('play-icon').closest('button');
      await user.click(playButton);

      expect(mockOnPlayFile).toHaveBeenCalledWith(file);
    });

    it('should call onDeleteFile when delete button is clicked', async () => {
      const user = userEvent.setup();
      const file = createMockFile({ id: 5 });

      render(
        <FileList
          files={[file]}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />
      );

      const deleteButton = screen.getByTestId('trash-icon').closest('button');
      await user.click(deleteButton);

      expect(mockOnDeleteFile).toHaveBeenCalledWith(5);
    });

    it('should not call onDeleteFile for files without id', async () => {
      const _user = userEvent.setup();
      const file = createMockFile({ id: undefined });

      render(
        <FileList
          files={[file]}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />
      );

      // File without id should not be rendered
      expect(screen.queryByTestId('trash-icon')).not.toBeInTheDocument();
    });

    it('should not call handlers when they are undefined', async () => {
      const user = userEvent.setup();
      const file = createMockFile();
      const transcript = createMockTranscript({ status: 'completed' });

      render(
        <FileList
          files={[file]}
          transcripts={[transcript]}
          onPlayFile={undefined}
          onDeleteFile={undefined}
        />
      );

      const playButton = screen.getByTestId('play-icon').closest('button');
      const deleteButton = screen.getByTestId('trash-icon').closest('button');

      await user.click(playButton);
      await user.click(deleteButton);

      // Should not throw errors
      expect(playButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe('Badge Variants', () => {
    it('should use correct badge variants for different statuses', () => {
      const files = [
        createMockFile({ id: 1 }),
        createMockFile({ id: 2 }),
        createMockFile({ id: 3 }),
        createMockFile({ id: 4 }),
      ];

      const transcripts = [
        createMockTranscript({ id: 1, fileId: 1, status: 'completed' }),
        createMockTranscript({ id: 2, fileId: 2, status: 'processing' }),
        createMockTranscript({ id: 3, fileId: 3, status: 'failed' }),
        // No transcript for fileId: 4 (pending)
      ];

      render(
        <FileList
          files={files}
          transcripts={transcripts}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />
      );

      const _statusBadges = screen.getAllByText(/Completed|Processing|Failed|Pending/);

      // Find badges and check their variants
      const completedBadge = screen.getByText('Completed').closest('span');
      const processingBadge = screen.getByText('Processing').closest('span');
      const failedBadge = screen.getByText('Failed').closest('span');
      const pendingBadge = screen.getByText('Pending').closest('span');

      expect(completedBadge).toHaveAttribute('data-variant', 'default');
      expect(processingBadge).toHaveAttribute('data-variant', 'secondary');
      expect(failedBadge).toHaveAttribute('data-variant', 'destructive');
      expect(pendingBadge).toHaveAttribute('data-variant', 'outline');
    });

    it('should use outline variant for file type badge', () => {
      const file = createMockFile({ type: 'audio/wav' });

      render(
        <FileList
          files={[file]}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />
      );

      const typeBadge = screen.getByText('audio/wav').closest('span');
      expect(typeBadge).toHaveAttribute('data-variant', 'outline');
    });
  });

  describe('Multiple Files', () => {
    it('should handle multiple files correctly', () => {
      const files = [
        createMockFile({ id: 1, name: 'file1.mp3' }),
        createMockFile({ id: 2, name: 'file2.wav' }),
        createMockFile({ id: 3, name: 'file3.m4a' }),
      ];

      render(
        <FileList
          files={files}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />
      );

      expect(screen.getByText('file1.mp3')).toBeInTheDocument();
      expect(screen.getByText('file2.wav')).toBeInTheDocument();
      expect(screen.getByText('file3.m4a')).toBeInTheDocument();

      // Should have 3 rows (excluding header)
      const fileRows = screen.getAllByTestId('file-icon');
      expect(fileRows).toHaveLength(3);
    });

    it('should apply correct hover styling to rows', () => {
      const file = createMockFile();

      render(
        <FileList
          files={[file]}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />
      );

      const tableRow = screen.getByText('test-audio.mp3').closest('tr');
      expect(tableRow).toHaveClass('hover:bg-muted/50');
    });
  });

  describe('Accessibility', () => {
    it('should have proper table structure', () => {
      const file = createMockFile();

      render(
        <FileList
          files={[file]}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength(6);
      expect(screen.getAllByRole('row')).toHaveLength(2); // Header + 1 data row
    });

    it('should have accessible buttons with proper attributes', () => {
      const file = createMockFile();
      const transcript = createMockTranscript({ status: 'completed' });

      render(
        <FileList
          files={[file]}
          transcripts={[transcript]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2); // Play and delete buttons

      buttons.forEach((button) => {
        expect(button).toBeInstanceOf(HTMLButtonElement);
      });
    });
  });
});
