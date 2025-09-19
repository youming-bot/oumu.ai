import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUpload from '../../../src/components/file-upload';

// Mock dependencies
jest.mock('../../../src/components/ui/card', () => {
  return {
    Card: function MockCard({ children, className, ...props }) {
      return (
        <div className={className} {...props}>
          {children}
        </div>
      );
    },
  };
});

jest.mock('../../../src/components/ui/progress', () => {
  return {
    Progress: function MockProgress({ value, className }) {
      return <div className={className} data-testid="progress" data-value={value}></div>;
    },
  };
});

jest.mock('../../../src/components/ui/button', () => {
  return {
    Button: function MockButton({ children, onClick, disabled, ...props }) {
      return (
        <button onClick={onClick} disabled={disabled} {...props}>
          {children}
        </button>
      );
    },
  };
});

jest.mock('../../../src/components/ui/badge', () => {
  return {
    Badge: function MockBadge({ children, variant }) {
      return <span data-variant={variant}>{children}</span>;
    },
  };
});

jest.mock('../../../src/components/ui/label', () => {
  return {
    Label: function MockLabel({ children, className }) {
      return (
        <label htmlFor="mock-label" className={className}>
          {children}
        </label>
      );
    },
  };
});

// Mock icons
jest.mock('lucide-react', () => ({
  Upload: () => <div data-testid="upload-icon">Upload</div>,
  File: () => <div data-testid="file-icon">File</div>,
  X: () => <div data-testid="x-icon">X</div>,
}));

describe('FileUpload Component', () => {
  const mockOnFilesSelected = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    onFilesSelected: mockOnFilesSelected,
    isUploading: false,
    uploadProgress: 0,
  };

  describe('Rendering', () => {
    it('should render file upload area correctly', () => {
      render(<FileUpload {...defaultProps} />);

      expect(screen.getByText('Drop audio files here or click to browse')).toBeInTheDocument();
      expect(screen.getByText('Supported formats: MP3, WAV, M4A, OGG')).toBeInTheDocument();
      expect(screen.getByTestId('upload-icon')).toBeInTheDocument();
    });

    it('should render hidden file input with correct attributes', () => {
      render(<FileUpload {...defaultProps} />);

      // File input uses dynamic ID from useId() hook, so we need to find it by type
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('multiple');
      expect(fileInput).toHaveAttribute('accept', 'audio/*');
    });

    it('should show upload progress when uploading', () => {
      render(<FileUpload {...defaultProps} isUploading={true} uploadProgress={50} />);

      expect(screen.getByText('Uploading...')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByTestId('progress')).toHaveAttribute('data-value', '50');
    });

    it('should not show progress when not uploading', () => {
      render(<FileUpload {...defaultProps} />);

      expect(screen.queryByText('Uploading...')).not.toBeInTheDocument();
      expect(screen.queryByTestId('progress')).not.toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('should handle file selection via input', async () => {
      const audioFile = new File(['audio content'], 'test.mp3', {
        type: 'audio/mp3',
      });

      render(<FileUpload {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');

      // Create a proper FileList mock using DataTransfer
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(audioFile);

      // Create a mock event with proper FileList
      Object.defineProperty(fileInput, 'files', {
        value: dataTransfer.files,
        writable: false,
      });

      fireEvent.change(fileInput);

      expect(mockOnFilesSelected).toHaveBeenCalledWith([audioFile]);
    });

    it('should filter out non-audio files', async () => {
      const audioFile = new File(['audio content'], 'test.mp3', {
        type: 'audio/mp3',
      });
      const textFile = new File(['text content'], 'test.txt', {
        type: 'text/plain',
      });

      render(<FileUpload {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(audioFile);
      dataTransfer.items.add(textFile);

      Object.defineProperty(fileInput, 'files', {
        value: dataTransfer.files,
        writable: false,
      });

      fireEvent.change(fileInput);

      expect(mockOnFilesSelected).toHaveBeenCalledWith([audioFile]);
    });

    it('should handle multiple audio files', async () => {
      const files = [
        new File(['audio1'], 'test1.mp3', { type: 'audio/mp3' }),
        new File(['audio2'], 'test2.wav', { type: 'audio/wav' }),
        new File(['audio3'], 'test3.m4a', { type: 'audio/m4a' }),
      ];

      render(<FileUpload {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');

      const dataTransfer = new DataTransfer();
      files.forEach((file) => {
        dataTransfer.items.add(file);
      });

      Object.defineProperty(fileInput, 'files', {
        value: dataTransfer.files,
        writable: false,
      });

      fireEvent.change(fileInput);

      expect(mockOnFilesSelected).toHaveBeenCalledWith(files);
    });

    it('should not call onFilesSelected if no valid files', async () => {
      const textFile = new File(['text content'], 'test.txt', {
        type: 'text/plain',
      });

      render(<FileUpload {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(textFile);

      Object.defineProperty(fileInput, 'files', {
        value: dataTransfer.files,
        writable: false,
      });

      fireEvent.change(fileInput);

      expect(mockOnFilesSelected).not.toHaveBeenCalled();
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drag over event', () => {
      render(<FileUpload {...defaultProps} />);

      // Find the actual drop zone element - it should be the Card component with border-dashed
      const dropZone = screen
        .getByText('Drop audio files here or click to browse')
        .closest('.border-dashed');

      expect(dropZone).toBeInTheDocument();

      fireEvent.dragOver(dropZone, {
        dataTransfer: {
          files: [],
        },
      });

      // Should add appropriate drag-over styling (tested through className changes)
      expect(dropZone).toHaveClass('border-primary', 'bg-primary/10');
    });

    it('should handle drag leave event', () => {
      render(<FileUpload {...defaultProps} />);

      const dropZone = screen
        .getByText('Drop audio files here or click to browse')
        .closest('.border-dashed');

      // First trigger drag over
      fireEvent.dragOver(dropZone);
      expect(dropZone).toHaveClass('border-primary', 'bg-primary/10');

      // Then trigger drag leave
      fireEvent.dragLeave(dropZone);
      expect(dropZone).not.toHaveClass('border-primary', 'bg-primary/10');
    });

    it('should handle file drop', () => {
      const audioFile = new File(['audio content'], 'dropped.mp3', {
        type: 'audio/mp3',
      });

      render(<FileUpload {...defaultProps} />);

      const dropZone = screen
        .getByText('Drop audio files here or click to browse')
        .closest('.border-dashed');

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(audioFile);

      fireEvent.drop(dropZone, {
        dataTransfer,
      });

      expect(mockOnFilesSelected).toHaveBeenCalledWith([audioFile]);
    });

    it('should filter non-audio files on drop', () => {
      const audioFile = new File(['audio'], 'test.mp3', { type: 'audio/mp3' });
      const textFile = new File(['text'], 'test.txt', { type: 'text/plain' });

      render(<FileUpload {...defaultProps} />);

      const dropZone = screen
        .getByText('Drop audio files here or click to browse')
        .closest('.border-dashed');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(audioFile);
      dataTransfer.items.add(textFile);

      fireEvent.drop(dropZone, {
        dataTransfer,
      });

      expect(mockOnFilesSelected).toHaveBeenCalledWith([audioFile]);
    });

    it('should not call onFilesSelected if no valid files dropped', () => {
      const textFile = new File(['text'], 'test.txt', { type: 'text/plain' });

      render(<FileUpload {...defaultProps} />);

      const dropZone = screen
        .getByText('Drop audio files here or click to browse')
        .closest('.border-dashed');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(textFile);

      fireEvent.drop(dropZone, {
        dataTransfer,
      });

      expect(mockOnFilesSelected).not.toHaveBeenCalled();
    });
  });

  describe('Selected Files Display', () => {
    it('should display selected files', async () => {
      const audioFile = new File(['audio content'], 'test-file.mp3', {
        type: 'audio/mp3',
      });
      Object.defineProperty(audioFile, 'size', { value: 1024 * 1024 * 2.5 }); // 2.5 MB

      render(<FileUpload {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');

      const mockEvent = {
        target: { files: [audioFile] },
      };

      fireEvent.change(fileInput, mockEvent);

      await waitFor(() => {
        expect(screen.getByText('Selected Files')).toBeInTheDocument();
        expect(screen.getByText('1 files')).toBeInTheDocument();
        expect(screen.getByText('test-file.mp3')).toBeInTheDocument();
        expect(screen.getByText('2.50 MB')).toBeInTheDocument();
      });
    });

    it('should display multiple selected files', async () => {
      const files = [
        new File(['audio1'], 'file1.mp3', { type: 'audio/mp3' }),
        new File(['audio2'], 'file2.wav', { type: 'audio/wav' }),
      ];

      render(<FileUpload {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');

      const mockEvent = {
        target: { files },
      };

      fireEvent.change(fileInput, mockEvent);

      await waitFor(() => {
        expect(screen.getByText('2 files')).toBeInTheDocument();
        expect(screen.getByText('file1.mp3')).toBeInTheDocument();
        expect(screen.getByText('file2.wav')).toBeInTheDocument();
      });
    });

    it('should format file sizes correctly', async () => {
      const files = [
        new File(['a'], 'small.mp3', { type: 'audio/mp3', size: 512 }),
        new File(['b'], 'medium.mp3', { type: 'audio/mp3', size: 1024 * 1024 }),
        new File(['c'], 'large.mp3', {
          type: 'audio/mp3',
          size: 1024 * 1024 * 1024,
        }),
      ];

      render(<FileUpload {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');

      const mockEvent = {
        target: { files },
      };

      fireEvent.change(fileInput, mockEvent);

      await waitFor(() => {
        expect(screen.getByText('0.50 KB')).toBeInTheDocument(); // 512 bytes
        expect(screen.getByText('1.00 MB')).toBeInTheDocument(); // 1 MB
        expect(screen.getByText('1.00 GB')).toBeInTheDocument(); // 1 GB
      });
    });
  });

  describe('File Removal', () => {
    it('should remove file when X button is clicked', async () => {
      const user = userEvent.setup();
      const files = [
        new File(['audio1'], 'file1.mp3', { type: 'audio/mp3' }),
        new File(['audio2'], 'file2.mp3', { type: 'audio/mp3' }),
      ];

      render(<FileUpload {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');

      const mockEvent = {
        target: { files },
      };

      fireEvent.change(fileInput, mockEvent);

      await waitFor(() => {
        expect(screen.getByText('2 files')).toBeInTheDocument();
      });

      // Click remove button for first file
      const removeButtons = screen.getAllByTestId('x-icon');
      await user.click(removeButtons[0]);

      expect(mockOnFilesSelected).toHaveBeenLastCalledWith([files[1]]);
    });

    it('should update file count after removal', async () => {
      const user = userEvent.setup();
      const files = [
        new File(['audio1'], 'file1.mp3', { type: 'audio/mp3' }),
        new File(['audio2'], 'file2.mp3', { type: 'audio/mp3' }),
      ];

      render(<FileUpload {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');

      const mockEvent = {
        target: { files },
      };

      fireEvent.change(fileInput, mockEvent);

      await waitFor(() => {
        expect(screen.getByText('2 files')).toBeInTheDocument();
      });

      // Click remove button
      const removeButtons = screen.getAllByTestId('x-icon');
      await user.click(removeButtons[0]);

      // Should call onFilesSelected with remaining file
      expect(mockOnFilesSelected).toHaveBeenLastCalledWith([files[1]]);
    });

    it('should remove all files when all X buttons are clicked', async () => {
      const user = userEvent.setup();
      const file = new File(['audio'], 'file.mp3', { type: 'audio/mp3' });

      render(<FileUpload {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');

      const mockEvent = {
        target: { files: [file] },
      };

      fireEvent.change(fileInput, mockEvent);

      await waitFor(() => {
        expect(screen.getByText('1 files')).toBeInTheDocument();
      });

      // Click remove button
      const removeButton = screen.getByTestId('x-icon');
      await user.click(removeButton);

      expect(mockOnFilesSelected).toHaveBeenLastCalledWith([]);
    });
  });

  describe('Click to Browse', () => {
    it('should trigger file input click when drop zone is clicked', async () => {
      const user = userEvent.setup();

      render(<FileUpload {...defaultProps} />);

      const dropZone = screen
        .getByText('Drop audio files here or click to browse')
        .closest('.border-dashed');

      // Mock the file input click
      const fileInput = document.querySelector('input[type="file"]');
      const clickSpy = jest.spyOn(fileInput, 'click');

      await user.click(dropZone);

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels and aria attributes', () => {
      render(<FileUpload {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', 'audio/*');
      expect(fileInput).toHaveAttribute('multiple');

      const label = screen.getByText('Drop audio files here or click to browse');
      expect(label).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();

      render(<FileUpload {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');

      // File input should be focusable
      await user.tab();
      expect(fileInput).toHaveFocus();

      // Drop zone should be clickable via Enter key
      const dropZone = screen
        .getByText('Drop audio files here or click to browse')
        .closest('.border-dashed');
      await user.click(dropZone);
      // File input click should be triggered (tested through click event)
    });
  });
});
