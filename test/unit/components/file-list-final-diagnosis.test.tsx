import { render, screen } from '@testing-library/react';

// 完全模拟所有依赖
jest.mock('@/components/ui/table', () => ({
  Table: ({ children }) => <table data-testid="table">{children}</table>,
  TableBody: ({ children }) => <tbody data-testid="tbody">{children}</tbody>,
  TableCell: ({ children }) => <td data-testid="td">{children}</td>,
  TableHead: ({ children }) => <th data-testid="th">{children}</th>,
  TableHeader: ({ children }) => <thead data-testid="thead">{children}</thead>,
  TableRow: ({ children }) => <tr data-testid="tr">{children}</tr>,
}));

jest.mock('@/components/ui/button', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled }) => (
    <button type="button" onClick={onClick} disabled={disabled} data-testid="button">
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  __esModule: true,
  default: ({ children, variant }) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}));

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

jest.mock('@/components/ui/skeleton', () => ({
  __esModule: true,
  default: () => <div data-testid="skeleton">Loading</div>,
}));

jest.mock('@/components/ui/card', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="card">{children}</div>,
}));

jest.mock('@/components/ui/input', () => ({
  __esModule: true,
  default: (props) => <input data-testid="input" {...props} />,
}));

jest.mock('lucide-react', () => ({
  File: () => <div data-testid="icon-file">File</div>,
  Play: () => <div data-testid="icon-play">Play</div>,
  Trash2: () => <div data-testid="icon-trash">Trash</div>,
  Clock: () => <div data-testid="icon-clock">Clock</div>,
  CheckCircle: () => <div data-testid="icon-check">Check</div>,
  AlertCircle: () => <div data-testid="icon-alert">Alert</div>,
  Loader: () => <div data-testid="icon-loader">Loader</div>,
  Download: () => <div data-testid="icon-download">Download</div>,
  Filter: () => <div data-testid="icon-filter">Filter</div>,
  Square: () => <div data-testid="icon-square">Square</div>,
  SortAsc: () => <div data-testid="icon-sort">Sort</div>,
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args) => args.filter(Boolean).join(' '),
  formatFileSize: (bytes) => `${bytes} Bytes`,
  formatDuration: (seconds) => `${seconds}s`,
}));

describe('FileList Final Diagnosis', () => {
  it('should test actual component with minimal setup', () => {
    console.log('=== 最终诊断测试 ===');

    const mockFile = {
      id: 1,
      name: 'final-test.mp3',
      size: 1024,
      type: 'audio/mp3',
      blob: new Blob(['test']),
      duration: 60,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('步骤1: 导入组件');
    const FileList = require('../../../src/components/file-list.tsx').default;
    console.log('组件导入成功');

    console.log('步骤2: 测试空状态');
    const { rerender } = render(
      <FileList files={[]} transcripts={[]} onPlayFile={jest.fn()} onDeleteFile={jest.fn()} />
    );

    const emptyState = screen.queryByText(/No files uploaded|没有文件上传/);
    if (emptyState) {
      console.log('空状态渲染成功:', emptyState.textContent);
    } else {
      console.log('空状态渲染失败，当前内容:', screen.getByRole('document').textContent);
    }

    console.log('步骤3: 测试有文件状态');
    rerender(
      <FileList
        files={[mockFile]}
        transcripts={[]}
        onPlayFile={jest.fn()}
        onDeleteFile={jest.fn()}
      />
    );

    const fileName = screen.queryByText('final-test.mp3');
    if (fileName) {
      console.log('文件名渲染成功:', fileName.textContent);
    } else {
      console.log('文件名渲染失败');
      console.log('当前页面内容:', screen.getByRole('document').textContent.substring(0, 500));
    }

    console.log('步骤4: 检查是否有错误元素');
    const errorElements = screen.queryAllByText(/Error|错误/);
    if (errorElements.length > 0) {
      console.log(
        '发现错误元素:',
        errorElements.map((el) => el.textContent)
      );
    } else {
      console.log('未发现错误元素');
    }

    console.log('步骤5: 检查是否有undefined元素');
    const allElements = screen.getAllByRole('*');
    console.log('页面中总元素数量:', allElements.length);

    // 检查是否有空的或undefined的元素
    const emptyElements = allElements.filter(
      (el) => el.textContent === 'undefined' || el.textContent === 'null' || !el.textContent
    );
    if (emptyElements.length > 0) {
      console.log('发现空元素:', emptyElements.length);
    } else {
      console.log('未发现空元素');
    }
  });

  it('should analyze component structure deeply', () => {
    console.log('=== 深度组件结构分析 ===');

    // 读取组件源码
    const fs = require('node:fs');
    const path = require('node:path');
    const componentPath = path.join(__dirname, '../../../src/components/file-list.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');

    // 分析组件的关键部分
    console.log('1. 检查import语句');
    const imports = content.match(/^import.*$/gm);
    console.log('导入语句数量:', imports ? imports.length : 0);
    imports?.forEach((imp) => {
      console.log('  ', imp);
    });

    console.log('2. 检查组件定义');
    const fileRowMatch = content.match(/const FileRowComponent = React\.memo[\s\S]*?\}\);/);
    if (fileRowMatch) {
      console.log('FileRowComponent定义长度:', fileRowMatch[0].length);

      // 检查是否有语法问题
      const hasReturnStatement = fileRowMatch[0].includes('return (');
      const hasClosingTag = fileRowMatch[0].includes('</TableRow>');
      console.log('包含return语句:', hasReturnStatement);
      console.log('包含闭合标签:', hasClosingTag);
    }

    console.log('3. 检查FileList组件定义');
    const fileListMatch = content.match(/const FileList = React\.memo[\s\S]*?\}\);/);
    if (fileListMatch) {
      console.log('FileList组件定义长度:', fileListMatch[0].length);
    }

    console.log('4. 检查导出语句');
    const exportStatements = content.match(/^export.*$/gm);
    console.log('导出语句:', exportStatements);

    console.log('5. 检查可能的语法错误');
    const brackets = content.match(/\(/g) || [];
    const closingBrackets = content.match(/\)/g) || [];
    console.log('开括号数量:', brackets.length);
    console.log('闭括号数量:', closingBrackets.length);

    const curlyBraces = content.match(/\{/g) || [];
    const closingCurlyBraces = content.match(/\}/g) || [];
    console.log('开花括号数量:', curlyBraces.length);
    console.log('闭花括号数量:', closingCurlyBraces.length);

    // 检查JSX语法
    const jsxTags = content.match(/<[A-Z][a-zA-Z]*[^>]*>/g) || [];
    console.log('JSX组件标签数量:', jsxTags.length);

    const closingJsxTags = content.match(/<\/[A-Z][a-zA-Z]*>/g) || [];
    console.log('JSX闭合标签数量:', closingJsxTags.length);
  });
});
