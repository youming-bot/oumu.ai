import { render, screen } from '@testing-library/react';
import React from 'react';

describe('FileList Isolated Test', () => {
  it('should identify the exact problematic component', () => {
    console.log('=== 开始隔离测试 ===');

    // 创建一个极简的FileList组件来测试
    const SimpleFileList = ({ files }) => {
      console.log('SimpleFileList 渲染，files:', files);

      if (!files || files.length === 0) {
        return <div data-testid="empty-state">No files</div>;
      }

      return (
        <div data-testid="file-list">
          {files.map((file) => (
            <div key={file.id} data-testid="file-row">
              {file.name}
            </div>
          ))}
        </div>
      );
    };

    // 测试空状态
    const { rerender } = render(<SimpleFileList files={[]} />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    console.log('空状态测试通过');

    // 测试有文件的状态
    const mockFile = {
      id: 1,
      name: 'test.mp3',
      size: 1024,
      type: 'audio/mp3',
      blob: new Blob(['test']),
      duration: 60,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('准备测试有文件的状态...');
    rerender(<SimpleFileList files={[mockFile]} />);
    expect(screen.getByTestId('file-list')).toBeInTheDocument();
    expect(screen.getByText('test.mp3')).toBeInTheDocument();
    console.log('有文件状态测试通过');

    // 现在让我们逐步添加复杂性来找到问题
    console.log('=== 逐步添加复杂性 ===');

    const ComplexFileList = ({ files, transcripts }) => {
      console.log('ComplexFileList 渲染');

      if (!files || files.length === 0) {
        return <div data-testid="empty-state">No files</div>;
      }

      // 模拟 transcriptStatusMap 的逻辑
      const transcriptStatusMap = new Map();
      files.forEach((file) => {
        if (file.id) {
          const fileTranscripts = transcripts.filter((t) => t.fileId === file.id);
          if (fileTranscripts.length === 0) {
            transcriptStatusMap.set(file.id, 'pending');
          } else {
            const latestTranscript = fileTranscripts.reduce((latest, current) =>
              current.createdAt > latest.createdAt ? current : latest
            );
            transcriptStatusMap.set(file.id, latestTranscript.status);
          }
        }
      });

      const filteredAndSortedFiles = files.filter((file) => file.id);

      return (
        <div data-testid="file-list">
          {filteredAndSortedFiles.map((file) => {
            const status = transcriptStatusMap.get(file.id) || 'pending';
            return (
              <div key={file.id} data-testid="file-row" data-status={status}>
                {file.name} - {status}
              </div>
            );
          })}
        </div>
      );
    };

    // 测试复杂版本
    console.log('测试复杂版本...');
    render(<ComplexFileList files={[mockFile]} transcripts={[]} />);

    expect(screen.getByTestId('file-list')).toBeInTheDocument();
    expect(screen.getByText('test.mp3 - pending')).toBeInTheDocument();
    console.log('复杂版本测试通过');

    // 现在测试实际组件的导入
    console.log('=== 测试实际组件导入 ===');
    try {
      const actualFileList = require('../../../src/components/file-list.tsx').default;
      console.log('实际组件导入成功');

      // 测试空状态
      render(
        React.createElement(actualFileList, {
          files: [],
          transcripts: [],
          onPlayFile: jest.fn(),
          onDeleteFile: jest.fn(),
        })
      );

      console.log('实际组件空状态渲染成功');
    } catch (error) {
      console.log('实际组件导入或渲染失败:', error.message);
    }
  });

  it('should test component with detailed logging', () => {
    console.log('=== 详细日志测试 ===');

    // 创建一个可以详细记录渲染过程的组件
    const DebugFileList = ({ files }) => {
      console.log('DebugFileList: 开始渲染');
      console.log('DebugFileList: files参数:', files);

      try {
        if (!files || files.length === 0) {
          console.log('DebugFileList: 渲染空状态');
          return <div data-testid="empty">No files</div>;
        }

        console.log('DebugFileList: 开始处理文件列表');
        const filteredFiles = files.filter((f) => f.id);
        console.log('DebugFileList: 过滤后的文件:', filteredFiles);

        return (
          <div data-testid="file-list">
            {filteredFiles.map((file) => {
              console.log(`DebugFileList: 渲染文件 ${file.name}`);
              return (
                <div key={file.id} data-file-id={file.id}>
                  {file.name}
                </div>
              );
            })}
          </div>
        );
      } catch (error) {
        console.log('DebugFileList: 渲染过程中出错:', error);
        return <div data-testid="error">Error: {error.message}</div>;
      }
    };

    const mockFile = {
      id: 1,
      name: 'debug-test.mp3',
      size: 1024,
      type: 'audio/mp3',
      blob: new Blob(['test']),
      duration: 60,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    render(<DebugFileList files={[mockFile]} />);
    expect(screen.getByText('debug-test.mp3')).toBeInTheDocument();
    console.log('详细日志测试完成');
  });
});
