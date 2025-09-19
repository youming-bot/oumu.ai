import { act, renderHook, waitFor } from '@testing-library/react';
import { useFiles } from '../../../src/hooks/useFiles';
import { ErrorHandler } from '../../../src/lib/error-handler';
import { FileUploadUtils } from '../../../src/lib/file-upload';

// Mock dependencies
jest.mock('../../../src/lib/file-upload');
jest.mock('../../../src/lib/error-handler');

const mockFileUploadUtils = FileUploadUtils;
const mockErrorHandler = ErrorHandler;

describe('useFiles hook', () => {
  const mockFiles = [
    {
      id: 1,
      name: 'test1.mp3',
      size: 1024000,
      type: 'audio/mp3',
      blob: new Blob(['audio1']),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      name: 'test2.wav',
      size: 2048000,
      type: 'audio/wav',
      blob: new Blob(['audio2']),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockFileUploadUtils.getAllFiles.mockResolvedValue(mockFiles);
  });

  it('should initialize with empty files and load files on mount', async () => {
    const { result } = renderHook(() => useFiles());

    // Initial state - isLoading should be true because loading starts immediately
    expect(result.current.files).toEqual([]);
    expect(result.current.isLoading).toBe(true);

    // Wait for files to load
    await waitFor(() => {
      expect(result.current.files).toEqual(mockFiles);
    });

    expect(result.current.isLoading).toBe(false);
    expect(mockFileUploadUtils.getAllFiles).toHaveBeenCalledTimes(1);
  });

  it('should set loading state during file loading', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockFileUploadUtils.getAllFiles.mockReturnValue(promise);

    const { result } = renderHook(() => useFiles());

    // Should be loading initially
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    // Resolve the promise
    act(() => {
      resolvePromise(mockFiles);
    });

    // Should finish loading
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.files).toEqual(mockFiles);
    });
  });

  it('should handle errors when loading files', async () => {
    const error = new Error('Failed to load files');
    mockFileUploadUtils.getAllFiles.mockRejectedValue(error);

    const { result } = renderHook(() => useFiles());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockErrorHandler.handleAndShowError).toHaveBeenCalledWith(error, 'loadFiles');
    expect(result.current.files).toEqual([]);
  });

  it('should manually load files when loadFiles is called', async () => {
    const { result } = renderHook(() => useFiles());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.files).toEqual(mockFiles);
    });

    // Clear the mock to test manual call
    jest.clearAllMocks();
    mockFileUploadUtils.getAllFiles.mockResolvedValue([]);

    // Call loadFiles manually
    await act(async () => {
      await result.current.loadFiles();
    });

    expect(mockFileUploadUtils.getAllFiles).toHaveBeenCalledTimes(1);
    expect(result.current.files).toEqual([]);
  });

  it('should refresh files when refreshFiles is called', async () => {
    const { result } = renderHook(() => useFiles());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.files).toEqual(mockFiles);
    });

    // Clear the mock
    jest.clearAllMocks();
    const newFiles = [mockFiles[0]]; // Only one file
    mockFileUploadUtils.getAllFiles.mockResolvedValue(newFiles);

    // Call refreshFiles
    await act(async () => {
      await result.current.refreshFiles();
    });

    expect(mockFileUploadUtils.getAllFiles).toHaveBeenCalledTimes(1);
    expect(result.current.files).toEqual(newFiles);
  });

  it('should handle empty file list', async () => {
    mockFileUploadUtils.getAllFiles.mockResolvedValue([]);

    const { result } = renderHook(() => useFiles());

    await waitFor(() => {
      expect(result.current.files).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should maintain loading state correctly during multiple operations', async () => {
    const { result } = renderHook(() => useFiles());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.files).toEqual(mockFiles);
    });

    // Create delayed promise
    let resolvePromise: (value: any) => void;
    const delayedPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockFileUploadUtils.getAllFiles.mockReturnValue(delayedPromise);

    // Start loading
    act(() => {
      result.current.loadFiles();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    // Resolve
    act(() => {
      resolvePromise([]);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should provide all expected return values', () => {
    const { result } = renderHook(() => useFiles());

    expect(result.current).toHaveProperty('files');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('loadFiles');
    expect(result.current).toHaveProperty('refreshFiles');

    expect(typeof result.current.loadFiles).toBe('function');
    expect(typeof result.current.refreshFiles).toBe('function');
    expect(typeof result.current.isLoading).toBe('boolean');
    expect(Array.isArray(result.current.files)).toBe(true);
  });
});
