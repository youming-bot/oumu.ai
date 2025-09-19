import { render, screen } from '@testing-library/react';

// 简化的测试来诊断问题
console.log('=== 开始诊断 FileList 导入问题 ===');

// 测试导入是否成功
try {
  const FileListModule = require('../../../src/components/file-list.tsx');
  console.log('1. 直接 require 成功');
  console.log('Module type:', typeof FileListModule);
  console.log('Keys:', Object.keys(FileListModule));
  console.log('Default export:', typeof FileListModule.default);
} catch (error) {
  console.log('1. 直接 require 失败:', error.message);
}

// 测试 ES6 导入
try {
  import('../../../src/components/file-list.tsx')
    .then((module) => {
      console.log('2. ES6 import 成功');
      console.log('Module type:', typeof module);
      console.log('Default:', typeof module.default);
    })
    .catch((error) => {
      console.log('2. ES6 import 失败:', error.message);
    });
} catch (error) {
  console.log('2. ES6 import 失败:', error.message);
}

// 测试组件渲染
describe('FileList Import Diagnosis', () => {
  it('should be able to import the component', () => {
    // 检查文件是否存在
    console.log('3. 检查文件是否存在');

    // 尝试渲染一个简单的组件
    const TestComponent = () => {
      console.log('TestComponent 被渲染');
      return <div>Test Component</div>;
    };

    render(<TestComponent />);
    expect(screen.getByText('Test Component')).toBeInTheDocument();
    console.log('4. 基本渲染测试通过');
  });

  it('should check FileList component structure', () => {
    console.log('5. 检查 FileList 组件结构');

    // 读取组件文件内容
    const fs = require('node:fs');
    const path = require('node:path');

    const componentPath = path.join(__dirname, '../../../src/components/file-list.tsx');

    try {
      const content = fs.readFileSync(componentPath, 'utf8');
      console.log('6. 文件读取成功，大小:', content.length, 'bytes');

      // 检查是否包含 export default
      const hasDefaultExport = content.includes('export default FileList');
      console.log('7. 包含 export default FileList:', hasDefaultExport);

      // 检查是否有语法错误
      const hasReactImport = content.includes('import React');
      console.log('8. 包含 React import:', hasReactImport);

      // 检查组件定义
      const hasComponentDefinition = content.includes('const FileList = React.memo');
      console.log('9. 包含组件定义:', hasComponentDefinition);
    } catch (error) {
      console.log('6. 文件读取失败:', error.message);
    }
  });
});
