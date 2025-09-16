# 数据库迁移实现指南

## 当前状态分析

现有数据库配置 (`/src/lib/db.ts`) 有版本定义但缺少实际的迁移逻辑：
- 版本 1: 基础表结构
- 版本 2: 添加 updatedAt 字段和索引
- 版本 3: 添加术语表
- 版本 4: 添加单词时间戳支持

所有版本的 `upgrade` 方法都是空的，需要实现具体的迁移逻辑。

## 迁移策略

### 1. 迁移类型分类

#### 结构迁移 (Schema Migrations)
- 添加/删除表
- 添加/删除索引
- 修改字段类型

#### 数据迁移 (Data Migrations)
- 数据格式转换
- 数据清理
- 默认值设置

#### 复合迁移 (Combined Migrations)
- 结构变更 + 数据迁移

### 2. 迁移实现模式

```typescript
// 迁移函数模板
type MigrationFunction = (tx: Transaction) => Promise<void>;

interface Migration {
  version: number;
  description: string;
  up: MigrationFunction;    // 升级迁移
  down?: MigrationFunction; // 回滚迁移（可选）
}
```

## 具体迁移实现

### 迁移 1: 版本 1 → 版本 2

**变更内容**:
- 为所有表添加 `updatedAt` 字段
- 添加性能索引

```typescript
const migrationV1toV2: Migration = {
  version: 2,
  description: 'Add updatedAt field to all tables and add indexes',

  async up(tx) {
    // 1. 为 files 表添加 updatedAt 字段
    const files = await tx.table('files').toArray();
    for (const file of files) {
      await tx.table('files').update(file.id, {
        updatedAt: file.createdAt || new Date()
      });
    }

    // 2. 为 transcripts 表添加 updatedAt 字段
    const transcripts = await tx.table('transcripts').toArray();
    for (const transcript of transcripts) {
      await tx.table('transcripts').update(transcript.id, {
        updatedAt: transcript.createdAt || new Date()
      });
    }

    // 3. 为 segments 表添加 updatedAt 字段
    const segments = await tx.table('segments').toArray();
    for (const segment of segments) {
      await tx.table('segments').update(segment.id, {
        updatedAt: segment.createdAt || new Date()
      });
    }

    console.log('Migration v1->v2 completed: added updatedAt fields');
  },

  async down(tx) {
    // 回滚逻辑：移除 updatedAt 字段（如果需要）
    // 注意：Dexie 不支持直接删除字段，需要重建表
    console.warn('Rollback from v2 to v1 requires table recreation');
  }
};
```

### 迁移 2: 版本 2 → 版本 3

**变更内容**:
- 添加术语表 (terms)
- 初始化默认术语数据

```typescript
const migrationV2toV3: Migration = {
  version: 3,
  description: 'Add terms table and initial data',

  async up(tx) {
    // 术语表会在 Dexie 的 stores() 中自动创建
    // 这里可以添加初始数据
    const initialTerms = [
      {
        word: 'こんにちは',
        reading: 'konnichiwa',
        meaning: 'Hello',
        category: 'greetings',
        tags: ['basic', 'greeting']
      },
      {
        word: 'ありがとう',
        reading: 'arigatou',
        meaning: 'Thank you',
        category: 'greetings',
        tags: ['basic', 'politeness']
      }
    ];

    for (const term of initialTerms) {
      await tx.table('terms').add({
        ...term,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log('Migration v2->v3 completed: added terms table with initial data');
  }
};
```

### 迁移 3: 版本 3 → 版本 4

**变更内容**:
- 为 segments 表添加 wordTimestamps 字段
- 迁移现有数据（如果可能）

```typescript
const migrationV3toV4: Migration = {
  version: 4,
  description: 'Add wordTimestamps support to segments',

  async up(tx) {
    // 获取所有现有的 segments
    const segments = await tx.table('segments').toArray();

    for (const segment of segments) {
      // 为现有 segment 生成基本的单词时间戳（如果文本存在）
      if (segment.text && !segment.wordTimestamps) {
        const words = segment.text.split(/\s+/).filter(word => word.length > 0);
        const duration = segment.end - segment.start;
        const wordDuration = duration / Math.max(words.length, 1);

        const wordTimestamps = words.map((word, index) => ({
          word,
          start: segment.start + index * wordDuration,
          end: segment.start + (index + 1) * wordDuration,
          confidence: 0.9 // 默认置信度
        }));

        await tx.table('segments').update(segment.id, {
          wordTimestamps,
          updatedAt: new Date()
        });
      }
    }

    console.log('Migration v3->v4 completed: added wordTimestamps to segments');
  }
};
```

## 集成到数据库配置

### 修改 `/src/lib/db.ts`

```typescript
import { Migration, migrationV1toV2, migrationV2toV3, migrationV3toV4 } from './migrations';

class ShadowingLearningDB extends Dexie {
  // ... 现有代码

  constructor() {
    super('ShadowingLearningDB');

    // 版本 1 - 基础结构
    this.version(1).stores({
      files: '++id, name, createdAt',
      transcripts: '++id, fileId, status, createdAt',
      segments: '++id, transcriptId, start, end'
    });

    // 版本 2 - 添加 updatedAt 和索引
    this.version(2).stores({
      files: '++id, name, createdAt, updatedAt',
      transcripts: '++id, fileId, status, createdAt, updatedAt',
      segments: '++id, transcriptId, start, end, createdAt'
    }).upgrade(migrationV1toV2.up);

    // 版本 3 - 添加术语表
    this.version(3).stores({
      files: '++id, name, createdAt, updatedAt',
      transcripts: '++id, fileId, status, createdAt, updatedAt',
      segments: '++id, transcriptId, start, end, createdAt',
      terms: '++id, word, category, tags, createdAt, updatedAt'
    }).upgrade(migrationV2toV3.up);

    // 版本 4 - 单词时间戳支持
    this.version(4).stores({
      files: '++id, name, createdAt, updatedAt',
      transcripts: '++id, fileId, status, createdAt, updatedAt',
      segments: '++id, transcriptId, start, end, createdAt, wordTimestamps',
      terms: '++id, word, category, tags, createdAt, updatedAt'
    }).upgrade(migrationV3toV4.up);
  }
}
```

## 迁移管理工具

### 创建迁移管理类 (`/src/lib/migration-manager.ts`)

```typescript
import { db } from './db';
import { Migration } from './migrations';

export class MigrationManager {
  static async getCurrentVersion(): Promise<number> {
    return db.version;
  }

  static async getPendingMigrations(currentVersion: number): Promise<Migration[]> {
    // 这里应该返回所有版本大于 currentVersion 的迁移
    const allMigrations = await this.getAllMigrations();
    return allMigrations.filter(m => m.version > currentVersion);
  }

  static async runMigrations(): Promise<void> {
    try {
      const currentVersion = await this.getCurrentVersion();
      const pendingMigrations = await this.getPendingMigrations(currentVersion);

      if (pendingMigrations.length === 0) {
        console.log('No pending migrations');
        return;
      }

      console.log(`Running ${pendingMigrations.length} migrations...`);

      for (const migration of pendingMigrations) {
        console.log(`Running migration v${migration.version}: ${migration.description}`);

        await db.transaction('rw', db.tables, async (tx) => {
          await migration.up(tx);
        });

        console.log(`Migration v${migration.version} completed successfully`);
      }

      console.log('All migrations completed successfully');

    } catch (error) {
      console.error('Migration failed:', error);
      throw new Error(`Database migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getAllMigrations(): Promise<Migration[]> {
    // 返回所有迁移，按版本排序
    return [
      migrationV1toV2,
      migrationV2toV3,
      migrationV3toV4
    ].sort((a, b) => a.version - b.version);
  }

  static async validateMigrations(): Promise<boolean> {
    // 验证迁移的完整性和正确性
    const migrations = await this.getAllMigrations();

    // 检查版本连续性
    for (let i = 0; i < migrations.length - 1; i++) {
      if (migrations[i].version + 1 !== migrations[i + 1].version) {
        console.error(`Missing migration between v${migrations[i].version} and v${migrations[i + 1].version}`);
        return false;
      }
    }

    return true;
  }
}
```

## 迁移测试策略

### 单元测试 (`/src/__tests__/migrations.test.ts`)

```typescript
import { fakeIndexedDB } from 'fake-indexeddb';
import { migrationV1toV2 } from '@/lib/migrations/v1-to-v2';

describe('Database Migrations', () => {
  describe('v1 to v2 migration', () => {
    it('should add updatedAt field to all tables', async () => {
      // 设置测试数据库
      const db = new Dexie('TestDB', { indexedDB: fakeIndexedDB });

      db.version(1).stores({
        files: '++id, name, createdAt',
        transcripts: '++id, fileId, status, createdAt',
        segments: '++id, transcriptId, start, end'
      });

      // 添加测试数据
      await db.open();
      await db.files.add({ name: 'test.txt', size: 100, type: 'text/plain', createdAt: new Date() });

      // 运行迁移
      await db.transaction('rw', db.tables, async (tx) => {
        await migrationV1toV2.up(tx);
      });

      // 验证迁移结果
      const files = await db.files.toArray();
      expect(files[0]).toHaveProperty('updatedAt');
      expect(files[0].updatedAt).toBeInstanceOf(Date);
    });
  });
});
```

### 集成测试

```typescript
describe('Migration Manager', () => {
  it('should run all pending migrations', async () => {
    const initialVersion = await MigrationManager.getCurrentVersion();

    await MigrationManager.runMigrations();

    const finalVersion = await MigrationManager.getCurrentVersion();
    expect(finalVersion).toBeGreaterThan(initialVersion);
  });
});
```

## 生产环境考虑

### 1. 迁移安全性
- 总是在运行迁移前备份数据
- 提供迁移回滚机制（如果可能）
- 记录详细的迁移日志

### 2. 性能优化
- 对于大数据量的迁移，使用分批处理
- 避免在迁移过程中锁定数据库太久
- 提供进度指示

### 3. 错误处理
- 详细的错误日志
- 迁移失败时的恢复机制
- 用户友好的错误信息

### 4. 监控和告警
- 迁移执行时间监控
- 失败迁移的告警
- 迁移后数据验证

## 实施步骤

1. **创建迁移文件结构**
   ```
   /src/lib/migrations/
   ├── index.ts
   ├── v1-to-v2.ts
   ├── v2-to-v3.ts
   └── v3-to-v4.ts
   ```

2. **实现具体迁移逻辑**

3. **集成迁移管理器**

4. **添加迁移测试**

5. **更新数据库配置**

6. **添加应用启动时的迁移检查**

## 启动时迁移检查

在应用启动时自动检查并运行迁移：

```typescript
// /src/lib/db.ts
export const db = new ShadowingLearningDB();

// 应用启动时运行迁移
db.on('ready', async () => {
  try {
    await MigrationManager.runMigrations();
  } catch (error) {
    console.error('Failed to run database migrations:', error);
    // 可以根据错误严重程度决定是否继续运行
  }
});
```

通过这套完整的迁移实施方案，可以确保数据库结构的平滑演进，同时保证数据的完整性和一致性。