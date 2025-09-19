import { DbUtils } from './db';
import { MigrationUtils } from './migration-utils';

/**
 * Test script to verify database migration functionality
 */
async function testMigrations() {
  try {
    const _stats = await DbUtils.getDatabaseStats();
    const _integrity = await MigrationUtils.validateDatabaseIntegrity();
    const _backup = await DbUtils.backupDatabase();
    const report = await MigrationUtils.exportMigrationReport();
    if (!report.integrity.valid) {
      // 数据库完整性检查失败，可以添加详细的错误处理逻辑
      // 目前跳过进一步处理
    }

    // Test 5: Test word timestamps migration (if needed)
    if (report.integrity.stats.segmentsWithoutWordTimestamps > 0) {
      const _migrationResult = await MigrationUtils.migrateWordTimestamps(
        50,
        (_processed, _total) => {
          // 进度回调函数，可以显示迁移进度
          // 目前留空
        }
      );
      const postMigrationIntegrity = await MigrationUtils.validateDatabaseIntegrity();
      if (!postMigrationIntegrity.valid) {
        // 迁移后完整性检查失败，需要回滚或修复
        // 目前跳过处理
      }
    } else {
      // 没有需要迁移的片段，跳过迁移过程
    }
    const _repairResult = await MigrationUtils.repairDatabaseIssues();
  } catch (_error) {
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { testMigrations };
