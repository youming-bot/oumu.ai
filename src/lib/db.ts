import Dexie, { type Table } from 'dexie';
import { handleError, handleSilently } from '@/lib/error-handler';
import type { FileRow, Segment, Term, TranscriptRow } from '@/types/database';

class ShadowingLearningDb extends Dexie {
  files!: Table<FileRow>;
  transcripts!: Table<TranscriptRow>;
  segments!: Table<Segment>;
  terms!: Table<Term>;

  constructor() {
    super('ShadowingLearningDB');

    this.version(1).stores({
      files: '++id, name, createdAt',
      transcripts: '++id, fileId, status, createdAt',
      segments: '++id, transcriptId, start, end',
    });

    // Add indexes for better query performance
    this.version(2)
      .stores({
        files: '++id, name, createdAt, updatedAt',
        transcripts: '++id, fileId, status, createdAt, updatedAt',
        segments: '++id, transcriptId, start, end, createdAt',
      })
      .upgrade(() => {
        // Migration logic if needed
      });

    // Add terminology table
    this.version(3)
      .stores({
        files: '++id, name, createdAt, updatedAt',
        transcripts: '++id, fileId, status, createdAt, updatedAt',
        segments: '++id, transcriptId, start, end, createdAt',
        terms: '++id, word, category, tags, createdAt, updatedAt',
      })
      .upgrade(() => {
        // Migration logic if needed
      });

    // Add word timestamps support
    this.version(4)
      .stores({
        files: '++id, name, createdAt, updatedAt',
        transcripts: '++id, fileId, status, createdAt, updatedAt',
        segments: '++id, transcriptId, start, end, createdAt, wordTimestamps',
        terms: '++id, word, category, tags, createdAt, updatedAt',
      })
      .upgrade(async (tx) => {
        try {
          // Get all existing segments to add wordTimestamps field
          const segmentsTable = tx.table('segments');
          const allSegments = await segmentsTable.toArray();

          // Update each segment to add empty wordTimestamps array
          const updatePromises = allSegments.map(async (segment) => {
            if (segment.wordTimestamps === undefined) {
              await segmentsTable.update(segment.id, {
                wordTimestamps: [],
              });
            }
          });

          await Promise.all(updatePromises);
        } catch (error) {
          const appError = handleError(error, 'db-migration-v4');
          throw appError; // Re-throw to abort the migration
        }
      });
  }
}

export const db = new ShadowingLearningDb();

// File operations
export async function addFile(
  fileData: Omit<FileRow, 'id' | 'createdAt' | 'updatedAt'>
): Promise<number> {
  try {
    const now = new Date();

    const fileId = await db.files.add({
      ...fileData,
      createdAt: now,
      updatedAt: now,
    });
    return fileId;
  } catch (error) {
    const appError = handleError(error, 'DBUtils.addFile');
    throw appError;
  }
}

export async function getFile(id: number): Promise<FileRow | undefined> {
  try {
    return await db.files.get(id);
  } catch (error) {
    const appError = handleError(error, 'DBUtils.getFile');
    throw appError;
  }
}

export async function getAllFiles(): Promise<FileRow[]> {
  try {
    return await db.files.orderBy('createdAt').reverse().toArray();
  } catch (error) {
    const appError = handleError(error, 'DBUtils.getAllFiles');
    throw appError;
  }
}

export async function updateFile(
  id: number,
  updates: Partial<Omit<FileRow, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    await db.files.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    const appError = handleError(error, 'DBUtils.updateFile');
    throw appError;
  }
}

export async function deleteFile(id: number): Promise<void> {
  try {
    // Delete associated transcripts and segments first
    const transcripts = await db.transcripts.where('fileId').equals(id).toArray();
    const transcriptIds = transcripts
      .map((t) => t.id)
      .filter((id): id is number => id !== undefined);

    if (transcriptIds.length > 0) {
      await db.segments.where('transcriptId').anyOf(transcriptIds).delete();
      await db.transcripts.where('fileId').equals(id).delete();
    }

    await db.files.delete(id);
  } catch (error) {
    const appError = handleError(error, 'DBUtils.deleteFile');
    throw appError;
  }
}

// Transcript operations
export async function addTranscript(
  transcriptData: Omit<TranscriptRow, 'id' | 'createdAt' | 'updatedAt'>
): Promise<number> {
  try {
    const now = new Date();
    const transcriptId = await db.transcripts.add({
      ...transcriptData,
      createdAt: now,
      updatedAt: now,
    });
    return transcriptId;
  } catch (error) {
    const appError = handleError(error, 'DBUtils.addTranscript');
    throw appError;
  }
}

export async function getTranscript(id: number): Promise<TranscriptRow | undefined> {
  try {
    return await db.transcripts.get(id);
  } catch (error) {
    const appError = handleError(error, 'DBUtils.getTranscript');
    throw appError;
  }
}

export async function getTranscriptsByFileId(fileId: number): Promise<TranscriptRow[]> {
  try {
    return await db.transcripts.where('fileId').equals(fileId).toArray();
  } catch (error) {
    const appError = handleError(error, 'DBUtils.getTranscriptsByFileId');
    throw appError;
  }
}

export async function updateTranscript(
  id: number,
  updates: Partial<Omit<TranscriptRow, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    await db.transcripts.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    const appError = handleError(error, 'DBUtils.updateTranscript');
    throw appError;
  }
}

export async function deleteTranscript(id: number): Promise<void> {
  try {
    // Delete associated segments first
    await db.segments.where('transcriptId').equals(id).delete();
    await db.transcripts.delete(id);
  } catch (error) {
    const appError = handleError(error, 'DBUtils.deleteTranscript');
    throw appError;
  }
}

// Segment operations
export async function addSegment(
  segmentData: Omit<Segment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<number> {
  try {
    const now = new Date();
    const segmentId = await db.segments.add({
      ...segmentData,
      createdAt: now,
      updatedAt: now,
    });
    return segmentId;
  } catch (error) {
    const appError = handleError(error, 'DBUtils.addSegment');
    throw appError;
  }
}

export async function addSegments(
  segmentsData: Omit<Segment, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<void> {
  try {
    const now = new Date();
    const segmentsWithTimestamps = segmentsData.map((segment) => ({
      ...segment,
      createdAt: now,
      updatedAt: now,
    }));
    await db.segments.bulkAdd(segmentsWithTimestamps);
  } catch (error) {
    const appError = handleError(error, 'DBUtils.addSegments');
    throw appError;
  }
}

export async function getSegmentsByTranscriptId(transcriptId: number): Promise<Segment[]> {
  try {
    return await db.segments.where('transcriptId').equals(transcriptId).sortBy('start');
  } catch (error) {
    const appError = handleError(error, 'DBUtils.getSegmentsByTranscriptId');
    throw appError;
  }
}

export async function getSegment(id: number): Promise<Segment | undefined> {
  try {
    return await db.segments.get(id);
  } catch (error) {
    const appError = handleError(error, 'DBUtils.getSegment');
    throw appError;
  }
}

export async function getSegmentAtTime(
  transcriptId: number,
  time: number
): Promise<Segment | undefined> {
  try {
    const segments = await db.segments
      .where('transcriptId')
      .equals(transcriptId)
      .filter((segment) => segment.start <= time && segment.end >= time)
      .toArray();

    return segments[0]; // Return the first matching segment
  } catch (error) {
    const appError = handleError(error, 'DBUtils.getSegmentAtTime');
    throw appError;
  }
}

export async function updateSegment(
  id: number,
  updates: Partial<Omit<Segment, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  try {
    await db.segments.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    const appError = handleError(error, 'DBUtils.updateSegment');
    throw appError;
  }
}

export async function deleteSegment(id: number): Promise<void> {
  try {
    await db.segments.delete(id);
  } catch (error) {
    const appError = handleError(error, 'DBUtils.deleteSegment');
    throw appError;
  }
}

// Terminology operations
export async function addTerm(
  termData: Omit<Term, 'id' | 'createdAt' | 'updatedAt'>
): Promise<number> {
  try {
    const now = new Date();
    const termId = await db.terms.add({
      ...termData,
      createdAt: now,
      updatedAt: now,
    });
    return termId;
  } catch (error) {
    const appError = handleError(error, 'DBUtils.addTerm');
    throw appError;
  }
}

export async function getTerm(id: number): Promise<Term | undefined> {
  try {
    return await db.terms.get(id);
  } catch (error) {
    const appError = handleError(error, 'DBUtils.getTerm');
    throw appError;
  }
}

export async function getAllTerms(): Promise<Term[]> {
  try {
    return await db.terms.orderBy('createdAt').reverse().toArray();
  } catch (error) {
    const appError = handleError(error, 'DBUtils.getAllTerms');
    throw appError;
  }
}

export async function searchTerms(query: string): Promise<Term[]> {
  try {
    const lowercaseQuery = query.toLowerCase();
    return await db.terms
      .filter((term) => {
        const hasWordMatch = term.word.toLowerCase().includes(lowercaseQuery);
        const hasMeaningMatch = term.meaning.toLowerCase().includes(lowercaseQuery);
        const hasReadingMatch = term.reading
          ? term.reading.toLowerCase().includes(lowercaseQuery)
          : false;
        const hasCategoryMatch = term.category
          ? term.category.toLowerCase().includes(lowercaseQuery)
          : false;
        const hasTagMatch = term.tags
          ? term.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
          : false;

        return (
          hasWordMatch || hasMeaningMatch || hasReadingMatch || hasCategoryMatch || hasTagMatch
        );
      })
      .toArray();
  } catch (error) {
    const appError = handleError(error, 'DBUtils.searchTerms');
    throw appError;
  }
}

export async function updateTerm(
  id: number,
  updates: Partial<Omit<Term, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    await db.terms.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    const appError = handleError(error, 'DBUtils.updateTerm');
    throw appError;
  }
}

export async function deleteTerm(id: number): Promise<void> {
  try {
    await db.terms.delete(id);
  } catch (error) {
    const appError = handleError(error, 'DBUtils.deleteTerm');
    throw appError;
  }
}

export async function getTermsByCategory(category: string): Promise<Term[]> {
  try {
    return await db.terms.where('category').equals(category).toArray();
  } catch (error) {
    const appError = handleError(error, 'DBUtils.getTermsByCategory');
    throw appError;
  }
}

export async function getTermsByTag(tag: string): Promise<Term[]> {
  try {
    return await db.terms.filter((term) => !!term.tags && term.tags.includes(tag)).toArray();
  } catch (error) {
    const appError = handleError(error, 'DBUtils.getTermsByTag');
    throw appError;
  }
}

// Migration utilities
export async function runMigrations(): Promise<void> {
  try {
    // Dexie automatically handles migrations when the database is opened
    // This method is for manual migration triggering if needed

    const _dbVersion = await db.version;
  } catch (error) {
    const appError = handleError(error, 'DBUtils.runMigrations');
    throw appError;
  }
}

export async function getDatabaseStats(): Promise<{
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
      db.terms.count(),
    ]);

    // Count segments that have word timestamps
    const segmentsWithWordTimestamps = await db.segments
      .filter((segment) => !!segment.wordTimestamps && segment.wordTimestamps.length > 0)
      .count();

    const dbVersion = await db.version;
    return {
      version: typeof dbVersion === 'number' ? dbVersion : 1,
      fileCount: files,
      transcriptCount: transcripts,
      segmentCount: segments,
      termCount: terms,
      segmentsWithWordTimestamps,
    };
  } catch (error) {
    const appError = handleError(error, 'DBUtils.getDatabaseStats');
    throw appError;
  }
}

export async function backupDatabase(): Promise<{
  files: FileRow[];
  transcripts: TranscriptRow[];
  segments: Segment[];
  terms: Term[];
  timestamp: Date;
}> {
  try {
    const [files, transcripts, segments, terms] = await Promise.all([
      db.files.toArray(),
      db.transcripts.toArray(),
      db.segments.toArray(),
      db.terms.toArray(),
    ]);

    const backup = {
      files,
      transcripts,
      segments,
      terms,
      timestamp: new Date(),
    };

    // Store backup in localStorage for emergency recovery
    try {
      localStorage.setItem('db_backup', JSON.stringify(backup));
      localStorage.setItem('db_backup_timestamp', backup.timestamp.toISOString());
    } catch (storageError) {
      // localStorage 备份失败不影响主要数据库操作
      handleSilently(storageError, 'localstorage-backup');
    }

    return backup;
  } catch (error) {
    const appError = handleError(error, 'DBUtils.backupDatabase');
    throw appError;
  }
}

export async function restoreFromBackup(backupData: {
  files: FileRow[];
  transcripts: TranscriptRow[];
  segments: Segment[];
  terms: Term[];
  timestamp: Date;
}): Promise<void> {
  try {
    // Clear existing data
    await clearDatabase();

    // Restore data
    await Promise.all([
      db.files.bulkAdd(backupData.files),
      db.transcripts.bulkAdd(backupData.transcripts),
      db.segments.bulkAdd(backupData.segments),
      db.terms.bulkAdd(backupData.terms),
    ]);
  } catch (error) {
    const appError = handleError(error, 'DBUtils.restoreFromBackup');
    throw appError;
  }
}

// Utility methods
export async function getFileWithTranscripts(fileId: number): Promise<{
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
    handleError(error, 'DBUtils.getFileWithTranscripts');
    throw error;
  }
}

export async function getTranscriptWithSegments(transcriptId: number): Promise<{
  transcript: TranscriptRow;
  segments: Segment[];
}> {
  try {
    const transcript = await db.transcripts.get(transcriptId);
    if (!transcript) {
      throw new Error('Transcript not found');
    }

    const segments = await db.segments.where('transcriptId').equals(transcriptId).sortBy('start');

    return { transcript, segments };
  } catch (error) {
    handleError(error, 'DBUtils.getTranscriptWithSegments');
    throw error;
  }
}

// Transaction support methods
export async function withTransaction<T>(operation: (tx: unknown) => Promise<T>): Promise<T> {
  try {
    return await db.transaction('rw', [db.files, db.transcripts, db.segments, db.terms], operation);
  } catch (error) {
    const appError = handleError(error, 'DBUtils.withTransaction');
    throw appError;
  }
}

export async function addFileWithTranscript(
  fileData: Omit<FileRow, 'id' | 'createdAt' | 'updatedAt'>,
  transcriptData: Omit<TranscriptRow, 'id' | 'fileId' | 'createdAt' | 'updatedAt'>
): Promise<{ fileId: number; transcriptId: number }> {
  return await withTransaction(async () => {
    const fileId = await addFile(fileData);
    const transcriptId = await addTranscript({
      ...transcriptData,
      fileId,
    });
    return { fileId, transcriptId };
  });
}

export async function addTranscriptWithSegments(
  transcriptData: Omit<TranscriptRow, 'id' | 'createdAt' | 'updatedAt'>,
  segments: Omit<Segment, 'id' | 'transcriptId' | 'createdAt' | 'updatedAt'>[]
): Promise<{ transcriptId: number; segmentIds: number[] }> {
  return await withTransaction(async () => {
    const transcriptId = await addTranscript(transcriptData);
    const segmentIds: number[] = [];

    for (const segmentData of segments) {
      const segmentId = await addSegment({
        ...segmentData,
        transcriptId,
      });
      segmentIds.push(segmentId);
    }

    return { transcriptId, segmentIds };
  });
}

export async function deleteFileWithDependencies(fileId: number): Promise<void> {
  return await withTransaction(async () => {
    // Delete all segments that belong to transcripts of this file
    const transcripts = await db.transcripts.where('fileId').equals(fileId).toArray();

    for (const transcript of transcripts) {
      if (transcript.id) {
        await db.segments.where('transcriptId').equals(transcript.id).delete();
      }
    }

    // Delete all transcripts for this file
    await db.transcripts.where('fileId').equals(fileId).delete();

    // Delete the file itself
    await db.files.delete(fileId);
  });
}

export async function deleteTranscriptWithSegments(transcriptId: number): Promise<void> {
  return await withTransaction(async () => {
    // Delete all segments for this transcript
    await db.segments.where('transcriptId').equals(transcriptId).delete();

    // Delete the transcript itself
    await db.transcripts.delete(transcriptId);
  });
}

export async function updateTranscriptStatus(
  transcriptId: number,
  status: TranscriptRow['status'],
  additionalData?: Partial<Omit<TranscriptRow, 'id' | 'status'>>
): Promise<void> {
  return await withTransaction(async () => {
    await updateTranscript(transcriptId, {
      status,
      ...additionalData,
    });
  });
}

export async function clearDatabase(): Promise<void> {
  try {
    await Promise.all([
      db.files.clear(),
      db.transcripts.clear(),
      db.segments.clear(),
      db.terms.clear(),
    ]);
  } catch (error) {
    const appError = handleError(error, 'DBUtils.clearDatabase');
    throw appError;
  }
}

// 为了向后兼容，保留别名
// biome-ignore lint/complexity/noStaticOnlyClass: Backward compatibility for existing code
class DbUtils {
  static addFile = addFile;
  static getFile = getFile;
  static getAllFiles = getAllFiles;
  static updateFile = updateFile;
  static deleteFile = deleteFile;
  static addTranscript = addTranscript;
  static getTranscript = getTranscript;
  static getTranscriptsByFileId = getTranscriptsByFileId;
  static updateTranscript = updateTranscript;
  static deleteTranscript = deleteTranscript;
  static addSegment = addSegment;
  static addSegments = addSegments;
  static getSegmentsByTranscriptId = getSegmentsByTranscriptId;
  static getSegment = getSegment;
  static getSegmentAtTime = getSegmentAtTime;
  static updateSegment = updateSegment;
  static deleteSegment = deleteSegment;
  static addTerm = addTerm;
  static getTerm = getTerm;
  static getAllTerms = getAllTerms;
  static searchTerms = searchTerms;
  static updateTerm = updateTerm;
  static deleteTerm = deleteTerm;
  static getTermsByCategory = getTermsByCategory;
  static getTermsByTag = getTermsByTag;
  static runMigrations = runMigrations;
  static getDatabaseStats = getDatabaseStats;
  static backupDatabase = backupDatabase;
  static restoreFromBackup = restoreFromBackup;
  static getFileWithTranscripts = getFileWithTranscripts;
  static getTranscriptWithSegments = getTranscriptWithSegments;
  static withTransaction = withTransaction;
  static addFileWithTranscript = addFileWithTranscript;
  static addTranscriptWithSegments = addTranscriptWithSegments;
  static deleteFileWithDependencies = deleteFileWithDependencies;
  static deleteTranscriptWithSegments = deleteTranscriptWithSegments;
  static updateTranscriptStatus = updateTranscriptStatus;
  static clearDatabase = clearDatabase;
}

export { DbUtils };

export default db;
