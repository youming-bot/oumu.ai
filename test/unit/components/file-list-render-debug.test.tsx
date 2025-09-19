import { render, screen } from '@testing-library/react';

// Mock all dependencies BEFORE importing the component
jest.mock('@/components/ui/table', () => {
  console.log('Mocking table components...');
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
  console.log('Mocking button component...');
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
  console.log('Mocking badge component...');
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
  console.log('Mocking tooltip components...');
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
  console.log('Mocking skeleton component...');
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
  console.log('Mocking card component...');
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
  console.log('Mocking input component...');
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

jest.mock('lucide-react', () => {
  console.log('Mocking lucide-react icons...');
  return {
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
  };
});

jest.mock('@/lib/utils', () => {
  console.log('Mocking utils functions...');
  return {
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
  };
});

// 现在导入组件
console.log('导入 FileList 组件...');
let FileList: any;
try {
  FileList = require('../../../src/components/file-list.tsx').default;
  console.log('FileList 组件导入成功');
  console.log('FileList 类型:', typeof FileList);
} catch (error) {
  console.log('FileList 导入失败:', error.message);
  console.log('Stack:', error.stack);
}

describe('FileList Render Debug', () => {
  it('should render without props to see what happens', () => {
    console.log('=== 开始渲染测试 ===');

    if (!FileList) {
      console.log('FileList 组件未导入，跳过测试');
      return;
    }

    console.log('尝试渲染 FileList 组件...');

    try {
      // 尝试渲染一个空的组件
      const { container } = render(
        <FileList files={[]} transcripts={[]} onPlayFile={jest.fn()} onDeleteFile={jest.fn()} />
      );

      console.log('渲染成功！');
      console.log('Container HTML:', container.innerHTML.substring(0, 500));

      // 检查是否渲染了预期的内容
      const noFilesText = screen.queryByText(/No files uploaded|没有文件上传/);
      if (noFilesText) {
        console.log('找到了空状态文本:', noFilesText.textContent);
      } else {
        console.log('未找到空状态文本');
        console.log('页面内容:', screen.getByRole('document').textContent);
      }
    } catch (error) {
      console.log('渲染失败:', error.message);
      console.log('Stack:', error.stack);

      // 尝试更详细的错误分析
      if (error.message.includes('Element type is invalid')) {
        console.log('=== 错误分析 ===');
        console.log('这是一个 React 组件导入问题');
        console.log('可能是以下原因之一：');
        console.log('1. 某个子组件没有正确导入');
        console.log('2. 组件的某个依赖项是 undefined');
        console.log('3. 组件内部有条件渲染问题');
      }
    }
  });

  it('should check component props and structure', () => {
    console.log('=== 检查组件结构 ===');

    if (!FileList) {
      console.log('FileList 组件未导入，跳过测试');
      return;
    }

    // 检查组件的原型
    console.log('Component prototype:', Object.getPrototypeOf(FileList));
    console.log('Component displayName:', FileList.displayName);

    // 检查组件的 render 方法
    if (FileList.prototype?.render) {
      console.log('Component has render method');
    } else {
      console.log('Component does not have render method');
    }
  });
});
