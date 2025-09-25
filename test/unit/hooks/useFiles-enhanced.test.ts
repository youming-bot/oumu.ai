/**
 * useFiles Hook 增强测试
 * 包含全面的错误处理测试和边界条件测试
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useFiles } from '@/hooks/useFiles';
import { ErrorHandler } from '@/lib/error-handler';
import { FileUploadUtils } from '@/lib/file-upload';
import {
  createTestFile,
  createTestError,
  createDatabaseState
} from '@test/factories/test-data-factories';

// Mock dependencies
jest.mock('@/lib/file-upload');
jest.mock('@/lib/error-handler');

const mockFileUploadUtils = FileUploadUtils;
const mockErrorHandler = ErrorHandler;

// 模拟文件读取器
class MockFileReader {
  result: string | ArrayBuffer | null = null;
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;

  readAsArrayBuffer(blob: Blob) {
    setTimeout(() => {
      this.result = new ArrayBuffer(1024);
      if (this.onload) {
        this.onload(new ProgressEvent('load'));
      }
    }, 0);
  }

  readAsDataURL(blob: Blob) {
    setTimeout(() => {
      this.result = 'data:audio/mpeg;base64,test';
      if (this.onload) {
        this.onload(new ProgressEvent('load'));
      }
    }, 0);
  }
}

// 设置全局模拟
global.FileReader = MockFileReader as any;

describe('useFiles Hook 增强测试', () => {
  const mockFiles = [
    createTestFile({ id: 1, name: 'test1.mp3' }),
    createTestFile({ id: 2, name: 'test2.wav' }),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockFileUploadUtils.getAllFiles.mockResolvedValue(mockFiles);
  });

  afterEach(() => {
    // 清理任何可能的状态
    jest.resetAllMocks();
  });

  describe('文件加载功能', () => {
    it('应该正确初始化并加载文件', async () => {
      const { result } = renderHook(() => useFiles());

      // 初始状态 - 文件应该为空
      expect(result.current.files).toEqual([]);

      // 等待异步操作完成
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.files).toEqual(mockFiles);
      });

      expect(mockFileUploadUtils.getAllFiles).toHaveBeenCalledTimes(1);
    });

    it('应该处理文件加载错误', async () => {
      const testError = createTestError({ message: 'Failed to load files' });
      mockFileUploadUtils.getAllFiles.mockRejectedValue(testError);

      const { result } = renderHook(() => useFiles());

      // 等待异步操作完成
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.files).toEqual([]);
      });

      expect(mockErrorHandler.handleAndShowError).toHaveBeenCalledWith(testError, 'loadFiles');
    });

    it('应该处理空文件列表', async () => {
      mockFileUploadUtils.getAllFiles.mockResolvedValue([]);

      const { result } = renderHook(() => useFiles());

      // 等待异步操作完成
      await waitFor(() => {
        expect(result.current.files).toEqual([]);
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('手动加载文件', () => {
    it('应该能够手动调用 loadFiles', async () => {
      const { result } = renderHook(() => useFiles());

      // 等待初始加载
      await waitFor(() => {
        expect(result.current.files).toEqual(mockFiles);
      });

      // 清除 mock 以测试手动调用
      jest.clearAllMocks();
      const newFiles = [createTestFile({ id: 3, name: 'test3.mp3' })];
      mockFileUploadUtils.getAllFiles.mockResolvedValue(newFiles);

      // 手动调用 loadFiles
      await act(async () => {
        await result.current.loadFiles();
      });

      expect(mockFileUploadUtils.getAllFiles).toHaveBeenCalledTimes(1);
      expect(result.current.files).toEqual(newFiles);
    });

    it('应该能够刷新文件', async () => {
      const { result } = renderHook(() => useFiles());

      // 等待初始加载
      await waitFor(() => {
        expect(result.current.files).toEqual(mockFiles);
      });

      // 清除 mock
      jest.clearAllMocks();
      const newFiles = [mockFiles[0]]; // 只有一个文件
      mockFileUploadUtils.getAllFiles.mockResolvedValue(newFiles);

      // 调用 refreshFiles
      await act(async () => {
        await result.current.refreshFiles();
      });

      expect(mockFileUploadUtils.getAllFiles).toHaveBeenCalledTimes(1);
      expect(result.current.files).toEqual(newFiles);
    });
  });

  describe('加载状态管理', () => {
    it('应该在文件加载过程中显示正确的加载状态', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockFileUploadUtils.getAllFiles.mockReturnValue(promise);

      const { result } = renderHook(() => useFiles());

      // 应该显示加载状态
      expect(result.current.isLoading).toBe(true);

      // 解析 promise
      await act(async () => {
        resolvePromise(mockFiles);
      });

      // 应该完成加载
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.files).toEqual(mockFiles);
      });
    });

    it('应该在多个操作期间正确维护加载状态', async () => {
      const { result } = renderHook(() => useFiles());

      // 等待初始加载
      await waitFor(() => {
        expect(result.current.files).toEqual(mockFiles);
      });

      // 创建延迟的 promise
      let resolvePromise: (value: any) => void;
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockFileUploadUtils.getAllFiles.mockReturnValue(delayedPromise);

      // 开始加载
      await act(async () => {
        result.current.loadFiles();
      });

      expect(result.current.isLoading).toBe(true);

      // 解析
      await act(async () => {
        resolvePromise([]);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('错误边界测试', () => {
    it('应该处理网络错误', async () => {
      const networkError = createTestError({
        message: 'Network Error',
        code: 'NETWORK_ERROR'
      });
      mockFileUploadUtils.getAllFiles.mockRejectedValue(networkError);

      const { result } = renderHook(() => useFiles());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.files).toEqual([]);
      });

      expect(mockErrorHandler.handleAndShowError).toHaveBeenCalledWith(
        networkError,
        'loadFiles'
      );
    });

    it('应该处理权限错误', async () => {
      const permissionError = createTestError({
        message: 'Permission denied',
        code: 'PERMISSION_ERROR'
      });
      mockFileUploadUtils.getAllFiles.mockRejectedValue(permissionError);

      const { result } = renderHook(() => useFiles());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockErrorHandler.handleAndShowError).toHaveBeenCalledWith(
        permissionError,
        'loadFiles'
      );
    });

    it('应该处理数据库损坏错误', async () => {
      const dbError = createTestError({
        message: 'Database corrupted',
        code: 'DB_CORRUPTED'
      });
      mockFileUploadUtils.getAllFiles.mockRejectedValue(dbError);

      const { result } = renderHook(() => useFiles());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockErrorHandler.handleAndShowError).toHaveBeenCalledWith(
        dbError,
        'loadFiles'
      );
    });
  });

  describe('返回值验证', () => {
    it('应该提供所有预期的返回值', () => {
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

  describe('并发操作测试', () => {
    it('应该正确处理并发加载操作', async () => {
      const { result } = renderHook(() => useFiles());

      // 清除初始加载
      jest.clearAllMocks();

      // 创建多个并发操作
      const concurrentFiles = [
        createTestFile({ id: 1, name: 'concurrent1.mp3' }),
        createTestFile({ id: 2, name: 'concurrent2.mp3' })
      ];

      mockFileUploadUtils.getAllFiles.mockResolvedValue(concurrentFiles);

      // 并发调用 loadFiles 和 refreshFiles
      const loadPromise = result.current.loadFiles();
      const refreshPromise = result.current.refreshFiles();

      await Promise.all([loadPromise, refreshPromise]);

      await waitFor(() => {
        expect(result.current.files).toEqual(concurrentFiles);
      });

      // 确保只调用了两次 API
      expect(mockFileUploadUtils.getAllFiles).toHaveBeenCalledTimes(2);
    });
  });

  describe('内存管理测试', () => {
    it('应该在大量文件加载时保持性能', async () => {
      // 创建大量测试文件
      const largeFileList = Array.from({ length: 1000 }, (_, index) =>
        createTestFile({ id: index + 1, name: `file${index + 1}.mp3` })
      );

      mockFileUploadUtils.getAllFiles.mockResolvedValue(largeFileList);

      const { result } = renderHook(() => useFiles());

      // 测量加载时间
      const startTime = performance.now();

      await waitFor(() => {
        expect(result.current.files).toHaveLength(1000);
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // 验证加载时间在合理范围内（少于 5 秒）
      expect(loadTime).toBeLessThan(5000);

      // 验证内存使用合理
      const memoryUsage = process.memoryUsage();
      expect(memoryUsage.heapUsed).toBeLessThan(500 * 1024 * 1024); // 500MB
    });
  });

  describe('边界条件测试', () => {
    it('应该处理超长文件名', async () => {
      const longFileName = 'a'.repeat(500) + '.mp3';
      const fileWithLongName = createTestFile({ name: longFileName });

      mockFileUploadUtils.getAllFiles.mockResolvedValue([fileWithLongName]);

      const { result } = renderHook(() => useFiles());

      await waitFor(() => {
        expect(result.current.files).toHaveLength(1);
        expect(result.current.files[0].name).toBe(longFileName);
      });
    });

    it('应该处理超大文件', async () => {
      const hugeFile = createTestFile({
        size: 1024 * 1024 * 1024 * 2, // 2GB
        name: 'huge.mp3'
      });

      mockFileUploadUtils.getAllFiles.mockResolvedValue([hugeFile]);

      const { result } = renderHook(() => useFiles());

      await waitFor(() => {
        expect(result.current.files).toHaveLength(1);
        expect(result.current.files[0].size).toBe(1024 * 1024 * 1024 * 2);
      });
    });

    it('应该处理特殊字符文件名', async () => {
      const specialFileName = '测试文件 🎵.mp3';
      const fileWithSpecialName = createTestFile({ name: specialFileName });

      mockFileUploadUtils.getAllFiles.mockResolvedValue([fileWithSpecialName]);

      const { result } = renderHook(() => useFiles());

      await waitFor(() => {
        expect(result.current.files).toHaveLength(1);
        expect(result.current.files[0].name).toBe(specialFileName);
      });
    });
  });

  describe('状态一致性测试', () => {
    it('应该在错误后保持状态一致', async () => {
      const { result } = renderHook(() => useFiles());

      // 等待初始加载
      await waitFor(() => {
        expect(result.current.files).toEqual(mockFiles);
      });

      // 模拟加载失败
      const testError = createTestError({ message: 'Load failed' });
      mockFileUploadUtils.getAllFiles.mockRejectedValue(testError);

      // 尝试加载 - 需要验证错误处理而不是抛出异常
      try {
        await act(async () => {
          await result.current.loadFiles();
        });
      } catch (error) {
        // 预期会发生错误
      }

      // 验证错误处理器被调用
      expect(mockErrorHandler.handleAndShowError).toHaveBeenCalledWith(
        testError,
        'loadFiles'
      );

      // 状态应该保持一致
      expect(result.current.files).toEqual(mockFiles);
      expect(result.current.isLoading).toBe(false);
    });

    it('应该在并发操作后保持状态一致', async () => {
      const { result } = renderHook(() => useFiles());

      // 等待初始加载
      await waitFor(() => {
        expect(result.current.files).toEqual(mockFiles);
      });

      // 清除 mock
      jest.clearAllMocks();

      const newFiles = [createTestFile({ id: 3, name: 'new.mp3' })];
      mockFileUploadUtils.getAllFiles.mockResolvedValue(newFiles);

      // 并发操作
      await Promise.all([
        result.current.loadFiles(),
        result.current.refreshFiles()
      ]);

      await waitFor(() => {
        // 状态应该一致
        expect(result.current.files).toEqual(newFiles);
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});