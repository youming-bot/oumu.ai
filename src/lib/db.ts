import Dexie, { Table } from 'dexie';
import {
  FileRow,
  TranscriptRow,
  Segment,
  Term
} from '@/types/database';
import { ErrorHandler } from '@/lib/error-handler';

class ShadowingLearningDB extends Dexie {
  files!: Table<FileRow>;
  transcripts!: Table<TranscriptRow>;
  segments!: Table<Segment>;
  terms!: Table<Term>;

  constructor() {
    super('ShadowingLearningDB');
    
    this.version(1).stores({
      files: '++id, name, createdAt',
      transcripts: '++id, fileId, status, createdAt',
      segments: '++id, transcriptId, start, end'
    });

    // Add indexes for better query performance
    this.version(2).stores({
      files: '++id, name, createdAt, updatedAt',
      transcripts: '++id, fileId, status, createdAt, updatedAt',
      segments: '++id, transcriptId, start, end, createdAt'
    }).upgrade(() => {
      // Migration logic if needed
    });

    // Add terminology table
    this.version(3).stores({
      files: '++id, name, createdAt, updatedAt',
      transcripts: '++id, fileId, status, createdAt, updatedAt',
      segments: '++id, transcriptId, start, end, createdAt',
      terms: '++id, word, category, tags, createdAt, updatedAt'
    }).upgrade(() => {
      // Migration logic if needed
    });

    // Add word timestamps support
    this.version(4).stores({
      files: '++id, name, createdAt, updatedAt',
      transcripts: '++id, fileId, status, createdAt, updatedAt',
      segments: '++id, transcriptId, start, end, createdAt, wordTimestamps',
      terms: '++id, word, category, tags, createdAt, updatedAt'
    }).upgrade(async (tx) => {
      try {
        console.log('Starting database migration to version 4: Adding word timestamps support');

        // Get all existing segments to add wordTimestamps field
        const segmentsTable = tx.table('segments');
        const allSegments = await segmentsTable.toArray();

        console.log(`Found ${allSegments.length} segments to migrate`);

        // Update each segment to add empty wordTimestamps array
        const updatePromises = allSegments.map(async (segment) => {
          if (segment.wordTimestamps === undefined) {
            await segmentsTable.update(segment.id, {
              wordTimestamps: []
            });
          }
        });

        await Promise.all(updatePromises);

        console.log('Database migration to version 4 completed successfully');
      } catch (error) {
        const appError = ErrorHandler.handleError(error, 'db-migration-v4');
        throw appError; // Re-throw to abort the migration
      }
    });
  }
}

export const db = new ShadowingLearningDB();

// Database utility functions
export class DBUtils {
  // File operations
  static async addFile(fileData: Omit<FileRow, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    try {
      const now = new Date();
      const fileId = await db.files.add({
        ...fileData,
        createdAt: now,
        updatedAt: now
      });
      return fileId;
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.addFile');
      throw appError;
    }
  }

  static async getFile(id: number): Promise<FileRow | undefined> {
    try {
      return await db.files.get(id);
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.getFile');
      throw appError;
    }
  }

  static async getAllFiles(): Promise<FileRow[]> {
    try {
      return await db.files.orderBy('createdAt').reverse().toArray();
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.getAllFiles');
      throw appError;
    }
  }

  static async updateFile(id: number, updates: Partial<Omit<FileRow, 'id' | 'createdAt'>>): Promise<void> {
    try {
      await db.files.update(id, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.updateFile');
      throw appError;
    }
  }

  static async deleteFile(id: number): Promise<void> {
    try {
      // Delete associated transcripts and segments first
      const transcripts = await db.transcripts.where('fileId').equals(id).toArray();
      const transcriptIds = transcripts.map(t => t.id).filter((id): id is number => id !== undefined);

      if (transcriptIds.length > 0) {
        await db.segments.where('transcriptId').anyOf(transcriptIds).delete();
        await db.transcripts.where('fileId').equals(id).delete();
      }

      await db.files.delete(id);
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.deleteFile');
      throw appError;
    }
  }

  // Transcript operations
  static async addTranscript(transcriptData: Omit<TranscriptRow, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    try {
      const now = new Date();
      const transcriptId = await db.transcripts.add({
        ...transcriptData,
        createdAt: now,
        updatedAt: now
      });
      return transcriptId;
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.addTranscript');
      throw appError;
    }
  }

  static async getTranscript(id: number): Promise<TranscriptRow | undefined> {
    try {
      return await db.transcripts.get(id);
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.getTranscript');
      throw appError;
    }
  }

  static async getTranscriptsByFileId(fileId: number): Promise<TranscriptRow[]> {
    try {
      return await db.transcripts.where('fileId').equals(fileId).toArray();
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.getTranscriptsByFileId');
      throw appError;
    }
  }

  static async updateTranscript(id: number, updates: Partial<Omit<TranscriptRow, 'id' | 'createdAt'>>): Promise<void> {
    try {
      await db.transcripts.update(id, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.updateTranscript');
      throw appError;
    }
  }

  static async deleteTranscript(id: number): Promise<void> {
    try {
      // Delete associated segments first
      await db.segments.where('transcriptId').equals(id).delete();
      await db.transcripts.delete(id);
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.deleteTranscript');
      throw appError;
    }
  }

  // Segment operations
  static async addSegment(segmentData: Omit<Segment, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    try {
      const now = new Date();
      const segmentId = await db.segments.add({
        ...segmentData,
        createdAt: now,
        updatedAt: now
      });
      return segmentId;
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.addSegment');
      throw appError;
    }
  }

  static async addSegments(segmentsData: Omit<Segment, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    try {
      const now = new Date();
      const segmentsWithTimestamps = segmentsData.map(segment => ({
        ...segment,
        createdAt: now,
        updatedAt: now
      }));
      await db.segments.bulkAdd(segmentsWithTimestamps);
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.addSegments');
      throw appError;
    }
  }

  static async getSegmentsByTranscriptId(transcriptId: number): Promise<Segment[]> {
    try {
      return await db.segments
        .where('transcriptId')
        .equals(transcriptId)
        .sortBy('start');
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.getSegmentsByTranscriptId');
      throw appError;
    }
  }

  static async getSegment(id: number): Promise<Segment | undefined> {
    try {
      return await db.segments.get(id);
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.getSegment');
      throw appError;
    }
  }

  static async getSegmentAtTime(transcriptId: number, time: number): Promise<Segment | undefined> {
    try {
      const segments = await db.segments
        .where('transcriptId')
        .equals(transcriptId)
        .filter(segment => segment.start <= time && segment.end >= time)
        .toArray();

      return segments[0]; // Return the first matching segment
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.getSegmentAtTime');
      throw appError;
    }
  }

  static async updateSegment(id: number, updates: Partial<Omit<Segment, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      await db.segments.update(id, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.updateSegment');
      throw appError;
    }
  }

  static async deleteSegment(id: number): Promise<void> {
    try {
      await db.segments.delete(id);
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.deleteSegment');
      throw appError;
    }
  }

  // Terminology operations
  static async addTerm(termData: Omit<Term, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    try {
      const now = new Date();
      const termId = await db.terms.add({
        ...termData,
        createdAt: now,
        updatedAt: now
      });
      return termId;
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.addTerm');
      throw appError;
    }
  }

  static async getTerm(id: number): Promise<Term | undefined> {
    try {
      return await db.terms.get(id);
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.getTerm');
      throw appError;
    }
  }

  static async getAllTerms(): Promise<Term[]> {
    try {
      return await db.terms.orderBy('createdAt').reverse().toArray();
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.getAllTerms');
      throw appError;
    }
  }

  static async searchTerms(query: string): Promise<Term[]> {
    try {
      const lowercaseQuery = query.toLowerCase();
      return await db.terms
        .filter(term => {
          const hasWordMatch = term.word.toLowerCase().includes(lowercaseQuery);
          const hasMeaningMatch = term.meaning.toLowerCase().includes(lowercaseQuery);
          const hasReadingMatch = term.reading ? term.reading.toLowerCase().includes(lowercaseQuery) : false;
          const hasCategoryMatch = term.category ? term.category.toLowerCase().includes(lowercaseQuery) : false;
          const hasTagMatch = term.tags ? term.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) : false;

          return hasWordMatch || hasMeaningMatch || hasReadingMatch || hasCategoryMatch || hasTagMatch;
        })
        .toArray();
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.searchTerms');
      throw appError;
    }
  }

  static async updateTerm(id: number, updates: Partial<Omit<Term, 'id' | 'createdAt'>>): Promise<void> {
    try {
      await db.terms.update(id, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.updateTerm');
      throw appError;
    }
  }

  static async deleteTerm(id: number): Promise<void> {
    try {
      await db.terms.delete(id);
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.deleteTerm');
      throw appError;
    }
  }

  static async getTermsByCategory(category: string): Promise<Term[]> {
    try {
      return await db.terms.where('category').equals(category).toArray();
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.getTermsByCategory');
      throw appError;
    }
  }

  static async getTermsByTag(tag: string): Promise<Term[]> {
    try {
      return await db.terms
        .filter(term => !!term.tags && term.tags.includes(tag))
        .toArray();
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.getTermsByTag');
      throw appError;
    }
  }

  // Migration utilities
  static async runMigrations(): Promise<void> {
    try {
      console.log('Checking for pending database migrations...');

      // Dexie automatically handles migrations when the database is opened
      // This method is for manual migration triggering if needed

      const dbVersion = await db.version;
      console.log(`Current database version: ${dbVersion}`);

    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.runMigrations');
      throw appError;
    }
  }

  static async getDatabaseStats(): Promise<{
    version: number;
    fileCount: number;
    transcriptCount: number;
    segmentCount: number;
    termCount: number;
    segmentsWithWordTimestamps: number;
  }> {
    try {
      const [files, transcripts, segments, terms] = await Promise.all([
        db.files.count(),
        db.transcripts.count(),
        db.segments.count(),
        db.terms.count()
      ]);

      // Count segments that have word timestamps
      const segmentsWithWordTimestamps = await db.segments
        .filter(segment => !!segment.wordTimestamps && segment.wordTimestamps.length > 0)
        .count();

      const dbVersion = await db.version;
      return {
        version: typeof dbVersion === 'number' ? dbVersion : 1,
        fileCount: files,
        transcriptCount: transcripts,
        segmentCount: segments,
        termCount: terms,
        segmentsWithWordTimestamps
      };
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.getDatabaseStats');
      throw appError;
    }
  }

  static async backupDatabase(): Promise<{
    files: FileRow[];
    transcripts: TranscriptRow[];
    segments: Segment[];
    terms: Term[];
    timestamp: Date;
  }> {
    try {
      console.log('Creating database backup...');

      const [files, transcripts, segments, terms] = await Promise.all([
        db.files.toArray(),
        db.transcripts.toArray(),
        db.segments.toArray(),
        db.terms.toArray()
      ]);

      const backup = {
        files,
        transcripts,
        segments,
        terms,
        timestamp: new Date()
      };

      console.log(`Database backup created with ${files.length} files, ${transcripts.length} transcripts, ${segments.length} segments, ${terms.length} terms`);

      // Store backup in localStorage for emergency recovery
      try {
        localStorage.setItem('db_backup', JSON.stringify(backup));
        localStorage.setItem('db_backup_timestamp', backup.timestamp.toISOString());
      } catch (storageError) {
        console.warn('Could not store backup in localStorage:', storageError);
      }

      return backup;
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.backupDatabase');
      throw appError;
    }
  }

  static async restoreFromBackup(backupData: {
    files: FileRow[];
    transcripts: TranscriptRow[];
    segments: Segment[];
    terms: Term[];
    timestamp: Date;
  }): Promise<void> {
    try {
      console.log('Restoring database from backup...');

      // Clear existing data
      await DBUtils.clearDatabase();

      // Restore data
      await Promise.all([
        db.files.bulkAdd(backupData.files),
        db.transcripts.bulkAdd(backupData.transcripts),
        db.segments.bulkAdd(backupData.segments),
        db.terms.bulkAdd(backupData.terms)
      ]);

      console.log('Database restored successfully from backup');
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.restoreFromBackup');
      throw appError;
    }
  }

  // Utility methods
  static async getFileWithTranscripts(fileId: number): Promise<{
    file: FileRow;
    transcripts: TranscriptRow[];
  }> {
    try {
      const file = await db.files.get(fileId);
      if (!file) {
        throw new Error('File not found');
      }

      const transcripts = await db.transcripts.where('fileId').equals(fileId).toArray();
      return { file, transcripts };
    } catch (error) {
      ErrorHandler.handleError(error, 'DBUtils.getFileWithTranscripts');
      throw error;
    }
  }

  static async getTranscriptWithSegments(transcriptId: number): Promise<{
    transcript: TranscriptRow;
    segments: Segment[];
  }> {
    try {
      const transcript = await db.transcripts.get(transcriptId);
      if (!transcript) {
        throw new Error('Transcript not found');
      }

      const segments = await db.segments
        .where('transcriptId')
        .equals(transcriptId)
        .sortBy('start');

      return { transcript, segments };
    } catch (error) {
      ErrorHandler.handleError(error, 'DBUtils.getTranscriptWithSegments');
      throw error;
    }
  }

  static async clearDatabase(): Promise<void> {
    try {
      await Promise.all([
        db.files.clear(),
        db.transcripts.clear(),
        db.segments.clear(),
        db.terms.clear()
      ]);
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'DBUtils.clearDatabase');
      throw appError;
    }
  }
}

export default db;