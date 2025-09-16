import { db, DBUtils } from './db';
import { WordTimestamp } from '@/types/database';
import { ErrorHandler } from '@/lib/error-handler';

/**
 * Advanced migration utilities for complex database operations
 */
export class MigrationUtils {
  /**
   * Migrate all segments to include word timestamps structure
   * This can be used for batch processing or manual migration triggering
   */
  static async migrateWordTimestamps(
    batchSize: number = 100,
    progressCallback?: (processed: number, total: number) => void
  ): Promise<{ processed: number; updated: number; errors: number }> {
    try {
      console.log('Starting word timestamps migration...');

      const totalSegments = await db.segments.count();
      console.log(`Total segments to process: ${totalSegments}`);

      let processed = 0;
      let updated = 0;
      let errors = 0;

      // Process in batches to avoid memory issues
      while (processed < totalSegments) {
        const segments = await db.segments
          .offset(processed)
          .limit(batchSize)
          .toArray();

        if (segments.length === 0) break;

        const updatePromises = segments.map(async (segment) => {
          try {
            // Only update segments that don't have wordTimestamps
            if (segment.wordTimestamps === undefined) {
              await db.segments.update(segment.id, {
                wordTimestamps: []
              });
              updated++;
            }
          } catch (error) {
            ErrorHandler.handleSilently(error, `migrateWordTimestamps-segment-${segment.id}`);
            errors++;
          }
        });

        await Promise.all(updatePromises);
        processed += segments.length;

        if (progressCallback) {
          progressCallback(processed, totalSegments);
        }

        console.log(`Processed ${processed}/${totalSegments} segments`);

        // Small delay to prevent UI blocking
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      console.log(`Word timestamps migration completed: ${processed} processed, ${updated} updated, ${errors} errors`);

      return { processed, updated, errors };
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'MigrationUtils.migrateWordTimestamps');
      throw appError;
    }
  }

  /**
   * Generate mock word timestamps for existing segments based on text content
   * This is useful for testing and demonstration purposes
   */
  static async generateMockWordTimestamps(
    transcriptId: number,
    progressCallback?: (processed: number, total: number) => void
  ): Promise<{ processed: number; generated: number; errors: number }> {
    try {
      console.log(`Generating mock word timestamps for transcript ${transcriptId}...`);

      const segments = await db.segments
        .where('transcriptId')
        .equals(transcriptId)
        .toArray();

      console.log(`Found ${segments.length} segments for transcript ${transcriptId}`);

      let processed = 0;
      let generated = 0;
      let errors = 0;

      for (const segment of segments) {
        try {
          // Only generate if no word timestamps exist
          if (!segment.wordTimestamps || segment.wordTimestamps.length === 0) {
            const wordTimestamps = this.createMockWordTimestamps(
              segment.text,
              segment.start,
              segment.end
            );

            await db.segments.update(segment.id, {
              wordTimestamps,
              updatedAt: new Date()
            });

            generated++;
          }
        } catch (error) {
          ErrorHandler.handleSilently(error, `generateMockWordTimestamps-segment-${segment.id}`);
          errors++;
        }

        processed++;

        if (progressCallback) {
          progressCallback(processed, segments.length);
        }

        // Small delay to prevent UI blocking
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      console.log(`Mock word timestamps generation completed: ${processed} processed, ${generated} generated, ${errors} errors`);

      return { processed, generated, errors };
    } catch (error) {
      console.error('Mock word timestamps generation failed:', error);
      throw new Error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create mock word timestamps for demonstration purposes
   */
  private static createMockWordTimestamps(
    text: string,
    segmentStart: number,
    segmentEnd: number
  ): WordTimestamp[] {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    if (words.length === 0) return [];

    const segmentDuration = segmentEnd - segmentStart;
    const wordDuration = segmentDuration / words.length;

    return words.map((word, index) => {
      const start = segmentStart + (index * wordDuration);
      const end = start + wordDuration;

      return {
        word: word.replace(/[^\w\s]/g, ''), // Remove punctuation
        start: parseFloat(start.toFixed(3)),
        end: parseFloat(end.toFixed(3)),
        confidence: 0.8 + (Math.random() * 0.2) // Random confidence between 0.8-1.0
      };
    });
  }

  /**
   * Validate database integrity after migrations
   */
  static async validateDatabaseIntegrity(): Promise<{
    valid: boolean;
    issues: string[];
    stats: {
      totalSegments: number;
      segmentsWithWordTimestamps: number;
      segmentsWithoutWordTimestamps: number;
    };
  }> {
    try {
      console.log('Validating database integrity...');

      const issues: string[] = [];
      const allSegments = await db.segments.toArray();

      // Check for segments without wordTimestamps field
      const segmentsWithoutWordTimestamps = allSegments.filter(
        segment => segment.wordTimestamps === undefined
      );

      if (segmentsWithoutWordTimestamps.length > 0) {
        issues.push(`${segmentsWithoutWordTimestamps.length} segments are missing wordTimestamps field`);
      }

      // Check for invalid word timestamp data
      const invalidWordTimestamps = allSegments.filter(
        segment => segment.wordTimestamps && !Array.isArray(segment.wordTimestamps)
      );

      if (invalidWordTimestamps.length > 0) {
        issues.push(`${invalidWordTimestamps.length} segments have invalid wordTimestamps format`);
      }

      const stats = {
        totalSegments: allSegments.length,
        segmentsWithWordTimestamps: allSegments.filter(
          segment => segment.wordTimestamps && Array.isArray(segment.wordTimestamps)
        ).length,
        segmentsWithoutWordTimestamps: segmentsWithoutWordTimestamps.length
      };

      const valid = issues.length === 0;

      console.log(`Database integrity validation ${valid ? 'passed' : 'failed'}:`, stats);

      if (!valid) {
        console.warn('Validation issues:', issues);
      }

      return { valid, issues, stats };
    } catch (error) {
      console.error('Database integrity validation failed:', error);
      throw new Error(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Repair database issues found during validation
   */
  static async repairDatabaseIssues(): Promise<{ repaired: number; errors: number }> {
    try {
      console.log('Repairing database issues...');

      const { issues } = await this.validateDatabaseIntegrity();
      if (issues.length === 0) {
        console.log('No issues found to repair');
        return { repaired: 0, errors: 0 };
      }

      let repaired = 0;
      let errors = 0;

      // Repair segments missing wordTimestamps
      const allSegments = await db.segments.toArray();
      const segmentsToRepair = allSegments.filter(
        segment => segment.wordTimestamps === undefined || !Array.isArray(segment.wordTimestamps)
      );

      console.log(`Repairing ${segmentsToRepair.length} segments...`);

      for (const segment of segmentsToRepair) {
        try {
          await db.segments.update(segment.id, {
            wordTimestamps: [],
            updatedAt: new Date()
          });
          repaired++;
        } catch (error) {
          console.error(`Error repairing segment ${segment.id}:`, error);
          errors++;
        }
      }

      console.log(`Database repair completed: ${repaired} repaired, ${errors} errors`);

      return { repaired, errors };
    } catch (error) {
      console.error('Database repair failed:', error);
      throw new Error(`Repair failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export migration logs and statistics
   */
  static async exportMigrationReport(): Promise<{
    timestamp: Date;
    databaseVersion: number;
    stats: {
      version: number;
      fileCount: number;
      transcriptCount: number;
      segmentCount: number;
      termCount: number;
      segmentsWithWordTimestamps: number;
    };
    integrity: {
      valid: boolean;
      issues: string[];
      stats: {
        totalSegments: number;
        segmentsWithWordTimestamps: number;
        segmentsWithoutWordTimestamps: number;
      };
    };
    backupAvailable: boolean;
  }> {
    try {
      const [stats, integrity] = await Promise.all([
        DBUtils.getDatabaseStats(),
        this.validateDatabaseIntegrity()
      ]);

      const backupTimestamp = localStorage.getItem('db_backup_timestamp');

      const dbVersion = await db.version;
      return {
        timestamp: new Date(),
        databaseVersion: typeof dbVersion === 'number' ? dbVersion : 1,
        stats,
        integrity,
        backupAvailable: !!backupTimestamp
      };
    } catch (error) {
      console.error('Error exporting migration report:', error);
      throw new Error(`Report export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}