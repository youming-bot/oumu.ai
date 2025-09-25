# 测试修复计划

## 第1阶段：修复基础测试问题

### 1.1 修复组件导入问题
**文件**: `test/unit/components/file-list-simple.test.tsx`
```typescript
// 检查导入路径
import FileList from '@/components/file-list';
// 或者
import { FileList } from '@/components/file-list';

// 验证组件是否正确导出
// 在 file-list.tsx 中确保有 export default FileList;
```

### 1.2 修复数据库初始化
**文件**: `test/unit/lib/transcription-service.test.ts`
```typescript
// 添加数据库初始化
beforeAll(async () => {
  // 模拟数据库环境
  const { db } = await import('@/lib/db');
  await db.open();
});

beforeEach(async () => {
  // 清理测试数据
  await db.files.clear();
  await db.transcripts.clear();
});
```

### 1.3 修复 React Testing Library 警告
**文件**: `test/integration/transcription-workflow.test.tsx`
```typescript
import { act } from '@testing-library/react';

// 将状态更新包装在 act() 中
await act(async () => {
  setTranscripts(prev => prev.map(t =>
    t.id === transcript.id ? completedTranscript : t
  ));
});
```

## 第2阶段：提高核心功能测试覆盖率

### 2.1 文件上传功能测试
**目标**: 从 72.72% 提升到 90%+
```typescript
// test/unit/lib/file-upload.test.ts 补充测试
describe('File Upload Validation', () => {
  test('should validate file size limits', () => {
    const largeFile = new File(['x'.repeat(100 * 1024 * 1024)], 'large.mp3');
    expect(validateFileSize(largeFile)).toBe(false);
  });

  test('should validate file types', () => {
    const invalidFile = new File(['content'], 'test.txt');
    expect(validateFileType(invalidFile)).toBe(false);
  });
});
```

### 2.2 数据库操作测试
**目标**: 从 15.78% 提升到 80%+
```typescript
// test/unit/lib/db.test.ts 补充测试
describe('Database Operations', () => {
  test('should handle concurrent file operations', async () => {
    const promises = Array.from({ length: 5 }, (_, i) =>
      db.files.add(createMockFile(i))
    );
    await Promise.all(promises);

    const files = await db.files.toArray();
    expect(files).toHaveLength(5);
  });

  test('should handle database version upgrades', async () => {
    // 测试迁移逻辑
  });
});
```

### 2.3 状态管理测试
**目标**: hooks 覆盖率提升到 70%+
```typescript
// test/unit/hooks/useFiles.test.ts
describe('useFiles Hook', () => {
  test('should manage file upload state', () => {
    const { result } = renderHook(() => useFiles());

    act(() => {
      result.current.addFile(mockFile);
    });

    expect(result.current.files).toHaveLength(1);
  });
});
```

## 第3阶段：集成测试优化

### 3.1 API 端点集成测试
```typescript
// test/integration/api-endpoints.test.ts
describe('API Endpoints Integration', () => {
  test('should handle file upload to transcription API', async () => {
    const formData = new FormData();
    formData.append('audio', mockAudioBlob);

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    expect(response.ok).toBe(true);
  });
});
```

### 3.2 端到端工作流测试
```typescript
// test/integration/end-to-end.test.ts
describe('End-to-End Workflow', () => {
  test('should complete file upload to transcription process', async () => {
    // 1. 上传文件
    // 2. 开始转录
    // 3. 监控进度
    // 4. 完成转录
    // 5. 播放音频
  });
});
```

## 第4阶段：性能和错误处理测试

### 4.1 错误边界测试
```typescript
// test/unit/components/error-boundary.test.ts
describe('Error Boundary', () => {
  test('should catch and display errors gracefully', () => {
    const BadComponent = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <BadComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });
});
```

### 4.2 性能测试
```typescript
// test/performance/file-processing.test.ts
describe('Performance Tests', () => {
  test('should handle large files efficiently', async () => {
    const largeFile = createLargeAudioFile(50 * 1024 * 1024); // 50MB

    const startTime = performance.now();
    await processFile(largeFile);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(5000); // 5秒内完成
  });
});
```

## 执行计划

### 第1周：修复基础问题
- [ ] 修复所有组件导入错误
- [ ] 解决数据库初始化问题
- [ ] 消除 React Testing Library 警告
- [ ] 确保现有测试通过

### 第2周：提升测试覆盖率
- [ ] 文件上传功能测试达到 90%+
- [ ] 数据库操作测试达到 80%+
- [ ] 状态管理测试达到 70%+
- [ ] API 服务测试达到 60%+

### 第3周：集成测试
- [ ] API 端点集成测试
- [ ] 端到端工作流测试
- [ ] 错误处理测试
- [ ] 性能基准测试

### 第4周：优化和文档
- [ ] 测试性能优化
- [ ] 测试文档完善
- [ ] CI/CD 集成
- [ ] 测试报告自动化

## 预期结果

### 测试覆盖率目标
- **整体覆盖率**: 从 6.51% 提升到 75%+
- **核心功能**: 90%+
- **关键模块**: 80%+
- **集成测试**: 70%+

### 质量指标
- **通过的测试数量**: 200+
- **测试失败率**: < 5%
- **测试执行时间**: < 2分钟
- **错误处理覆盖率**: 95%+

## 监控和维护

### 每日检查
- [ ] 测试执行状态
- [ ] 新增测试覆盖率
- [ ] 失败测试分析

### 每周审查
- [ ] 覆盖率趋势
- [ ] 性能指标
- [ ] 测试质量评估

### 每月优化
- [ ] 测试架构优化
- [ ] 工具链升级
- [ ] 最佳实践更新