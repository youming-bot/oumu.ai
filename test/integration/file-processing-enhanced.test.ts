/**
 * 文件处理增强集成测试
 * 测试完整的用户工作流程和错误处理场景
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { useFiles } from '@/hooks/useFiles';
import { useTranscripts } from '@/hooks/useTranscripts';
import { useTranscriptionProgress } from '@/hooks/useTranscriptionProgress';
import { useAppState } from '@/hooks/useAppState';
import FileUpload from '@/components/file-upload';
import FileList from '@/components/file-list';
import { db } from '@/lib/db';
import {
  createTestFile,
  createTestTranscript,
  createProcessingStatus,
  createTestError
} from '../factories/test-data-factories';

// 模拟 API
jest.mock('@/lib/groq-client');
jest.mock('@/lib/openrouter-client');
jest.mock('@/lib/db');

describe('文件处理增强集成测试', () => {
  let mockDb: any;

  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();

    // 设置模拟数据库
    mockDb = {
      files: {
        add: jest.fn(),
        where: jest.fn().mockReturnThis(),
        delete: jest.fn(),
        toArray: jest.fn(),
        put: jest.fn()
      },
      transcripts: {
        add: jest.fn(),
        where: jest.fn().mockReturnThis(),
        delete: jest.fn(),
        toArray: jest.fn()
      },
      transaction: jest.fn()
    };

    // 设置数据库模拟
    (db as any).mockImplementation(() => mockDb);

    // 模拟 API 响应
    const mockGroqClient = require('@/lib/groq-client');
    mockGroqClient.transcribeAudio.mockResolvedValue({
      text: 'テストテキスト',
      segments: [
        {
          start: 0,
          end: 5000,
          text: 'テストテキスト'
        }
      ]
    });

    const mockOpenRouterClient = require('@/lib/openrouter-client');
    mockOpenRouterClient.processTranscript.mockResolvedValue({
      segments: [
        {
          start: 0,
          end: 5000,
          text: 'テストテキスト',
          translation: '测试文本',
          annotations: ['test']
        }
      ]
    });
  });

  afterEach(() => {
    // 清理所有模拟
    jest.resetAllMocks();
  });

  describe('完整工作流程：上传到播放', () => {
    it('应该处理从文件上传到音频播放的完整工作流程', async () => {
      // 准备测试数据
      const testFile = new File(['test'], 'integration-test.mp3', { type: 'audio/mpeg' });
      const testFileData = createTestFile({ name: 'integration-test.mp3' });
      const testTranscript = createTestTranscript({ fileId: testFileData.id });

      // 模拟数据库操作
      mockDb.files.add.mockResolvedValue(testFileData);
      mockDb.files.toArray.mockResolvedValue([testFileData]);
      mockDb.transcripts.add.mockResolvedValue(testTranscript);
      mockDb.transcripts.toArray.mockResolvedValue([testTranscript]);

      // 渲染组件
      const { result: filesResult } = renderHook(() => useFiles());
      const { result: transcriptsResult } = renderHook(() => useTranscripts());
      const { result: progressResult } = renderHook(() => useTranscriptionProgress());

      // 步骤 1: 上传文件
      await act(async () => {
        await filesResult.current.uploadFile(testFile);
      });

      // 验证文件上传成功
      await waitFor(() => {
        expect(filesResult.current.files).toHaveLength(1);
        expect(filesResult.current.files[0].name).toBe('integration-test.mp3');
      });

      // 步骤 2: 开始转录
      await act(async () => {
        await transcriptsResult.startTranscription(testFileData.id);
      });

      // 验证转录进度
      await waitFor(() => {
        expect(progressResult.current.progress).toBeGreaterThan(0);
      });

      // 步骤 3: 模拟转录完成
      await act(async () => {
        await transcriptsResult.loadTranscripts(testFileData.id);
      });

      // 验证转录数据
      await waitFor(() => {
        expect(transcriptsResult.current.transcripts).toHaveLength(1);
        expect(transcriptsResult.current.transcripts[0].rawText).toBe('テストテキスト');
      });

      // 步骤 4: 验证文件状态更新为已完成
      await waitFor(() => {
        expect(filesResult.current.files[0].status).toBe('completed');
      });
    });

    it('应该处理工作流程中的错误', async () => {
      // 准备测试数据
      const testFile = new File(['test'], 'error-test.mp3', { type: 'audio/mpeg' });
      const testError = createTestError({ message: 'Transcription failed' });

      // 模拟文件上传成功但转录失败
      mockDb.files.add.mockResolvedValue(createTestFile({ name: 'error-test.mp3' }));
      mockDb.files.toArray.mockResolvedValue([createTestFile({ name: 'error-test.mp3' })]);

      // 模拟 API 错误
      const mockGroqClient = require('@/lib/groq-client');
      mockGroqClient.transcribeAudio.mockRejectedValue(testError);

      const { result: filesResult } = renderHook(() => useFiles());
      const { result: transcriptsResult } = renderHook(() => useTranscripts());

      // 上传文件
      await act(async () => {
        await filesResult.current.uploadFile(testFile);
      });

      // 尝试转录并期望错误
      await act(async () => {
        await expect(transcriptsResult.startTranscription('test-id')).rejects.toThrow('Transcription failed');
      });

      // 验证错误状态
      expect(transcriptsResult.current.error).toBeTruthy();
      expect(transcriptsResult.current.error.message).toBe('Transcription failed');
    });
  });

  describe('并发操作测试', () => {
    it('应该处理并发文件上传和转录', async () => {
      // 准备多个测试文件
      const testFiles = [
        new File(['test1'], 'concurrent1.mp3', { type: 'audio/mpeg' }),
        new File(['test2'], 'concurrent2.mp3', { type: 'audio/mpeg' })
      ];

      const testFileData1 = createTestFile({ name: 'concurrent1.mp3' });
      const testFileData2 = createTestFile({ name: 'concurrent2.mp3' });

      mockDb.files.add
        .mockResolvedValueOnce(testFileData1)
        .mockResolvedValueOnce(testFileData2);

      mockDb.files.toArray.mockResolvedValue([testFileData1, testFileData2]);

      const { result: filesResult } = renderHook(() => useFiles());

      // 并发上传文件
      const uploadPromises = testFiles.map(file => filesResult.current.uploadFile(file));

      await act(async () => {
        await Promise.all(uploadPromises);
      });

      // 验证所有文件都已上传
      await waitFor(() => {
        expect(filesResult.current.files).toHaveLength(2);
      });

      // 验证文件顺序
      expect(filesResult.current.files[0].name).toBe('concurrent1.mp3');
      expect(filesResult.current.files[1].name).toBe('concurrent2.mp3');
    });

    it('应该处理并发错误场景', async () => {
      // 准备测试文件
      const testFiles = [
        new File(['test1'], 'error1.mp3', { type: 'audio/mpeg' }),
        new File(['test2'], 'error2.mp3', { type: 'audio/mpeg' })
      ];

      const testError = createTestError({ message: 'Concurrent error' });

      // 模拟并发错误
      mockDb.files.add
        .mockRejectedValueOnce(testError)
        .mockRejectedValueOnce(testError);

      const { result: filesResult } = renderHook(() => useFiles());

      // 并发上传文件并期望错误
      const uploadPromises = testFiles.map(file =>
        expect(filesResult.current.uploadFile(file)).rejects.toThrow('Concurrent error')
      );

      await act(async () => {
        await Promise.all(uploadPromises);
      });

      // 验证没有文件被上传
      expect(filesResult.current.files).toHaveLength(0);
    });
  });

  describe('UI 组件集成测试', () => {
    it('应该正确显示文件上传组件', async () => {
      const mockOnFileUpload = jest.fn();

      render(React.createElement(FileUpload, { onFileUpload: mockOnFileUpload }));

      // 验证组件渲染
      expect(screen.getByText(/拖拽文件到这里/)).toBeInTheDocument();
      expect(screen.getByText(/或点击选择文件/)).toBeInTheDocument();
    });

    it('应该正确显示文件列表组件', async () => {
      const testFiles = [
        createTestFile({ name: 'file1.mp3', status: 'completed' }),
        createTestFile({ name: 'file2.mp3', status: 'processing' })
      ];

      const mockOnFileSelect = jest.fn();
      const mockOnFileDelete = jest.fn();

      render(
        React.createElement(FileList, {
          files: testFiles,
          transcripts: [],
          onPlayFile: mockOnFileSelect,
          onDeleteFile: mockOnFileDelete
        })
      );

      // 验证文件显示
      expect(screen.getByText('file1.mp3')).toBeInTheDocument();
      expect(screen.getByText('file2.mp3')).toBeInTheDocument();

      // 验证状态显示
      expect(screen.getByText('已完成')).toBeInTheDocument();
      expect(screen.getByText('处理中')).toBeInTheDocument();
    });

    it('应该处理文件上传交互', async () => {
      const mockOnFileUpload = jest.fn();
      const testFile = new File(['test'], 'interactive.mp3', { type: 'audio/mpeg' });

      render(React.createElement(FileUpload, { onFileUpload: mockOnFileUpload }));

      // 查找文件输入元素
      const fileInput = screen.getByTestId('file-input') || screen.getByRole('button');

      // 模拟文件选择
      fireEvent.change(fileInput, {
        target: { files: [testFile] }
      });

      // 验证回调被调用
      expect(mockOnFileUpload).toHaveBeenCalledWith(testFile);
    });
  });

  describe('状态管理集成测试', () => {
    it('应该在不同钩子之间保持状态一致性', async () => {
      const { result: appResult } = renderHook(() => useAppState());
      const { result: filesResult } = renderHook(() => useFiles());
      const { result: transcriptsResult } = renderHook(() => useTranscripts());

      // 测试文件上传后的状态更新
      const testFile = new File(['test'], 'state-test.mp3', { type: 'audio/mpeg' });
      const testFileData = createTestFile({ name: 'state-test.mp3' });

      mockDb.files.add.mockResolvedValue(testFileData);
      mockDb.files.toArray.mockResolvedValue([testFileData]);

      // 上传文件
      await act(async () => {
        await filesResult.current.uploadFile(testFile);
      });

      // 验证应用状态更新
      await waitFor(() => {
        expect(appResult.current.selectedFile).toBe(testFileData);
        expect(filesResult.current.files).toHaveLength(1);
      });

      // 测试转录状态更新
      const testTranscript = createTestTranscript({ fileId: testFileData.id });
      mockDb.transcripts.add.mockResolvedValue(testTranscript);
      mockDb.transcripts.toArray.mockResolvedValue([testTranscript]);

      // 开始转录
      await act(async () => {
        await transcriptsResult.startTranscription(testFileData.id);
      });

      // 验证状态一致性
      await waitFor(() => {
        expect(appResult.current.transcriptionStatus).toBe('processing');
        expect(transcriptsResult.current.transcripts).toHaveLength(1);
      });
    });
  });

  describe('性能相关测试', () => {
    it('应该处理大量文件的高效加载', async () => {
      // 创建大量测试文件
      const largeFileList = Array.from({ length: 100 }, (_, index) =>
        createTestFile({
          name: `file${index}.mp3`,
          id: `file-${index}`
        })
      );

      mockDb.files.toArray.mockResolvedValue(largeFileList);

      const { result } = renderHook(() => useFiles());

      // 测量加载时间
      const startTime = performance.now();

      await act(async () => {
        await result.current.loadFiles();
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // 验证加载时间在合理范围内（少于 2 秒）
      expect(loadTime).toBeLessThan(2000);

      // 验证所有文件都已加载
      expect(result.current.files).toHaveLength(100);
    });

    it('应该正确处理内存使用', async () => {
      // 创建包含大量数据的测试文件
      const largeFile = createTestFile({
        name: 'large-file.mp3',
        size: 50 * 1024 * 1024 // 50MB
      });

      mockDb.files.add.mockResolvedValue(largeFile);
      mockDb.files.toArray.mockResolvedValue([largeFile]);

      const { result } = renderHook(() => useFiles());

      // 测量内存使用前的情况
      const initialMemory = process.memoryUsage();

      await act(async () => {
        await result.current.uploadFile(new File(['x'.repeat(50 * 1024 * 1024)], 'large-file.mp3'));
      });

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // 验证内存增长在合理范围内（少于 100MB）
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);

      // 验证文件上传成功
      expect(result.current.files).toHaveLength(1);
    });
  });

  describe('错误恢复测试', () => {
    it('应该从网络错误中恢复', async () => {
      const testFile = new File(['test'], 'recovery-test.mp3', { type: 'audio/mpeg' });
      const testFileData = createTestFile({ name: 'recovery-test.mp3' });
      const networkError = createTestError({ message: 'Network error' });

      // 第一次尝试失败
      mockDb.files.add.mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useFiles());

      // 第一次上传应该失败
      await act(async () => {
        await expect(result.current.uploadFile(testFile)).rejects.toThrow('Network error');
      });

      // 第二次尝试成功
      mockDb.files.add.mockResolvedValueOnce(testFileData);
      mockDb.files.toArray.mockResolvedValueOnce([testFileData]);

      // 重试上传
      await act(async () => {
        await result.current.uploadFile(testFile);
      });

      // 验证恢复成功
      await waitFor(() => {
        expect(result.current.files).toHaveLength(1);
        expect(result.current.files[0].name).toBe('recovery-test.mp3');
      });
    });

    it('应该处理部分失败的场景', async () => {
      const testFiles = [
        new File(['test1'], 'partial1.mp3', { type: 'audio/mpeg' }),
        new File(['test2'], 'partial2.mp3', { type: 'audio/mpeg' })
      ];

      const testFileData1 = createTestFile({ name: 'partial1.mp3' });
      const partialError = createTestError({ message: 'Partial upload failed' });

      // 第一个文件成功，第二个失败
      mockDb.files.add
        .mockResolvedValueOnce(testFileData1)
        .mockRejectedValueOnce(partialError);

      mockDb.files.toArray.mockResolvedValue([testFileData1]);

      const { result } = renderHook(() => useFiles());

      // 并发上传
      const uploadPromises = testFiles.map(file =>
        result.current.uploadFile(file).catch(error => error)
      );

      const results = await Promise.all(uploadPromises);

      // 验证部分成功
      expect(results[0]).toBe(testFileData1);
      expect(results[1]).toBe(partialError);

      // 验证状态
      await waitFor(() => {
        expect(result.current.files).toHaveLength(1);
        expect(result.current.files[0].name).toBe('partial1.mp3');
      });
    });
  });

  describe('数据一致性测试', () => {
    it('应该确保文件和转录数据的一致性', async () => {
      const testFile = new File(['test'], 'consistency-test.mp3', { type: 'audio/mpeg' });
      const testFileData = createTestFile({ name: 'consistency-test.mp3' });
      const testTranscript = createTestTranscript({ fileId: testFileData.id });

      mockDb.files.add.mockResolvedValue(testFileData);
      mockDb.files.toArray.mockResolvedValue([testFileData]);
      mockDb.transcripts.add.mockResolvedValue(testTranscript);
      mockDb.transcripts.toArray.mockResolvedValue([testTranscript]);

      const { result: filesResult } = renderHook(() => useFiles());
      const { result: transcriptsResult } = renderHook(() => useTranscripts());

      // 上传文件
      await act(async () => {
        await filesResult.current.uploadFile(testFile);
      });

      // 开始转录
      await act(async () => {
        await transcriptsResult.startTranscription(testFileData.id);
      });

      // 验证数据一致性
      await waitFor(() => {
        expect(filesResult.current.files).toHaveLength(1);
        expect(transcriptsResult.current.transcripts).toHaveLength(1);

        const file = filesResult.current.files[0];
        const transcript = transcriptsResult.current.transcripts[0];

        expect(transcript.fileId).toBe(file.id);
        expect(file.status).toBe('completed');
      });
    });
  });
});