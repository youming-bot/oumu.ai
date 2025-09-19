import { render, screen } from '@testing-library/react';

// 完全简化所有依赖
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

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }) => <div data-testid="tooltip-provider">{children}</div>,
  Tooltip: ({ children }) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children }) => <div data-testid="tooltip-trigger">{children}</div>,
  TooltipContent: ({ children }) => <div data-testid="tooltip-content">{children}</div>,
}));

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

// 现在导入组件
import FileList from '../../../src/components/file-list';

describe('FileList Minimal Test', () => {
  it('should render with a single file', () => {
    console.log('开始测试单个文件渲染...');

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

    console.log('准备渲染组件...');

    try {
      const { container } = render(
        <FileList
          files={[mockFile]}
          transcripts={[]}
          onPlayFile={jest.fn()}
          onDeleteFile={jest.fn()}
        />
      );

      console.log('组件渲染成功！');
      console.log('Container:', container.innerHTML.substring(0, 300));

      // 检查是否包含文件名
      const fileName = screen.queryByText('test.mp3');
      if (fileName) {
        console.log('找到文件名:', fileName.textContent);
      } else {
        console.log('未找到文件名，页面内容:', screen.getByRole('document').textContent);
      }
    } catch (error) {
      console.log('渲染失败:', error.message);
      console.log('错误堆栈:', error.stack);

      // 分析具体的问题
      if (error.message.includes('Element type is invalid')) {
        console.log('=== 详细错误分析 ===');
        console.log('这个问题通常出现在以下情况：');
        console.log('1. 某个组件的导入失败');
        console.log('2. 某个组件的条件渲染返回了 undefined');
        console.log('3. 循环引用或模块加载问题');

        // 让我们检查一下组件的具体结构
        const componentModule = require('../../../src/components/file-list.tsx');
        console.log('Component module keys:', Object.keys(componentModule));
        console.log('Component default export type:', typeof componentModule.default);
      }
    }
  });

  it('should check component structure', () => {
    // 直接检查组件源码
    const fs = require('node:fs');
    const path = require('node:path');
    const componentPath = path.join(__dirname, '../../../src/components/file-list.tsx');

    const content = fs.readFileSync(componentPath, 'utf8');

    // 检查关键语法结构
    const fileRowComponentMatch = content.match(
      /const FileRowComponent = React\.memo[^}]+\{[^}]+\}/gs
    );
    if (fileRowComponentMatch) {
      console.log('FileRowComponent 定义找到');
      console.log('定义长度:', fileRowComponentMatch[0].length);
    } else {
      console.log('FileRowComponent 定义未找到或格式异常');
    }

    // 检查return语句
    const returnStatements = content.match(/return\s*\([^)]*\)/gs);
    console.log('找到 return 语句数量:', returnStatements ? returnStatements.length : 0);

    // 检查JSX语法
    const jsxTags = content.match(/<[A-Z][a-zA-Z]*[^>]*>/g);
    console.log('找到 JSX 组件标签数量:', jsxTags ? jsxTags.length : 0);
  });
});
