import { render, screen } from '@testing-library/react';

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
  const TooltipTrigger = ({ children, asChild }) =>
    asChild ? children : <div data-testid="tooltip-trigger">{children}</div>;
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
  SelectAll: () => <div data-testid="select-all-icon">SelectAll</div>,
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
import type { FileRow } from '../../../src/types/database';

describe('FileList Specific Issue Debug', () => {
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

  it('should render with files step by step', () => {
    console.log('=== Step by step rendering test ===');

    // Step 1: 先测试空的情况
    console.log('Step 1: 渲染空文件列表');
    const { unmount } = render(
      <FileList
        files={[]}
        transcripts={[]}
        onPlayFile={mockOnPlayFile}
        onDeleteFile={mockOnDeleteFile}
      />
    );

    expect(screen.getByText(/No files uploaded/)).toBeInTheDocument();
    console.log('Step 1: 空列表渲染成功');

    unmount();
    console.log('Step 1: 卸载完成');

    // Step 2: 测试单个文件
    console.log('Step 2: 渲染单个文件');
    const file = createMockFile({
      name: 'japanese-lesson.mp3',
      size: 2 * 1024 * 1024, // 2MB
      type: 'audio/mp3',
      duration: 240, // 4 minutes
    });

    try {
      render(
        <FileList
          files={[file]}
          transcripts={[]}
          onPlayFile={mockOnPlayFile}
          onDeleteFile={mockOnDeleteFile}
        />
      );

      console.log('Step 2: 单文件渲染成功');
      console.log('当前页面内容:', screen.getByRole('document').textContent.substring(0, 200));

      // 检查是否有错误
      const errorText = screen.queryByText(/Error/);
      if (errorText) {
        console.log('发现错误文本:', errorText.textContent);
      }
    } catch (error) {
      console.log('Step 2: 单文件渲染失败:', error.message);
      console.log('Stack:', error.stack);

      // 详细分析错误
      if (error.message.includes('Element type is invalid')) {
        console.log('=== 问题分析 ===');
        console.log('这个问题通常是因为：');
        console.log('1. 某个组件没有被正确导入');
        console.log('2. 某个组件的导出有问题');
        console.log('3. 条件渲染导致某个组件为 undefined');

        // 检查 FileRowComponent 是否有问题
        console.log('检查 FileRowComponent...');
        const fileListSource = require('../../../src/components/file-list.tsx');
        console.log('FileList 组件结构:', Object.keys(fileListSource));

        if (fileListSource.FileRowComponent) {
          console.log('FileRowComponent 存在:', typeof fileListSource.FileRowComponent);
        } else {
          console.log('FileRowComponent 不存在或未导出');
        }
      }
    }
  });

  it('should check component internals', () => {
    console.log('=== 检查组件内部结构 ===');

    // 检查组件源码
    const fs = require('node:fs');
    const path = require('node:path');
    const componentPath = path.join(__dirname, '../../../src/components/file-list.tsx');

    try {
      const content = fs.readFileSync(componentPath, 'utf8');

      // 检查关键组件定义
      const hasFileRowComponent = content.includes('const FileRowComponent = React.memo');
      const hasFileRowExport = content.includes('FileRowComponent.displayName');
      const hasFileListDefinition = content.includes('const FileList = React.memo');

      console.log('包含 FileRowComponent 定义:', hasFileRowComponent);
      console.log('包含 FileRowComponent 导出:', hasFileRowExport);
      console.log('包含 FileList 定义:', hasFileListDefinition);

      // 检查是否有语法问题
      const fileRowComponentMatches = content.match(
        /const FileRowComponent = React\.memo.*?\n\}\);/gs
      );
      if (fileRowComponentMatches) {
        console.log('FileRowComponent 定义长度:', fileRowComponentMatches[0].length);
        console.log('FileRowComponent 定义预览:', fileRowComponentMatches[0].substring(0, 100));
      }
    } catch (error) {
      console.log('读取组件文件失败:', error.message);
    }
  });
});
