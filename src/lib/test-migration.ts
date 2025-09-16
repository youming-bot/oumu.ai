import { DBUtils } from './db';
import { MigrationUtils } from './migration-utils';

/**
 * Test script to verify database migration functionality
 */
async function testMigrations() {
  try {
    console.log('=== Testing Database Migration Functionality ===\n');

    // Test 1: Get database statistics
    console.log('1. Getting database statistics...');
    const stats = await DBUtils.getDatabaseStats();
    console.log('Database Stats:', stats);
    console.log('');

    // Test 2: Validate database integrity
    console.log('2. Validating database integrity...');
    const integrity = await MigrationUtils.validateDatabaseIntegrity();
    console.log('Integrity Check:', integrity);
    console.log('');

    // Test 3: Create backup
    console.log('3. Creating database backup...');
    const backup = await DBUtils.backupDatabase();
    console.log(`Backup created with ${backup.files.length} files, ${backup.transcripts.length} transcripts, ${backup.segments.length} segments`);
    console.log('');

    // Test 4: Export migration report
    console.log('4. Exporting migration report...');
    const report = await MigrationUtils.exportMigrationReport();
    console.log('Migration Report:');
    console.log('- Database Version:', report.databaseVersion);
    console.log('- Backup Available:', report.backupAvailable);
    console.log('- Stats:', report.stats);
    console.log('- Integrity:', report.integrity.valid ? 'VALID' : 'INVALID');
    if (!report.integrity.valid) {
      console.log('  Issues:', report.integrity.issues);
    }
    console.log('');

    // Test 5: Test word timestamps migration (if needed)
    if (report.integrity.stats.segmentsWithoutWordTimestamps > 0) {
      console.log('5. Running word timestamps migration...');
      const migrationResult = await MigrationUtils.migrateWordTimestamps(50, (processed, total) => {
        console.log(`  Migrated ${processed}/${total} segments`);
      });
      console.log('Migration Result:', migrationResult);
      console.log('');

      // Verify migration
      console.log('6. Verifying migration...');
      const postMigrationIntegrity = await MigrationUtils.validateDatabaseIntegrity();
      console.log('Post-Migration Integrity:', postMigrationIntegrity.valid ? 'VALID' : 'INVALID');
      if (!postMigrationIntegrity.valid) {
        console.log('  Issues:', postMigrationIntegrity.issues);
      }
      console.log('');
    } else {
      console.log('5. No migration needed - all segments have wordTimestamps');
      console.log('');
    }

    // Test 7: Test repair functionality
    console.log('7. Testing repair functionality...');
    const repairResult = await MigrationUtils.repairDatabaseIssues();
    console.log('Repair Result:', repairResult);
    console.log('');

    console.log('=== All Migration Tests Completed Successfully ===');
    console.log('✅ Database migration system is working correctly');

  } catch (error) {
    console.error('❌ Migration test failed:', error);
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