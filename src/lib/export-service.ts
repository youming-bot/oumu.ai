import { FileRow, TranscriptRow, Segment } from '@/types/database';
import { DBUtils } from './db';

export interface ExportData {
  version: string;
  exportedAt: string;
  files: FileRow[];
  transcripts: TranscriptRow[];
  segments: Segment[];
}

export class ExportService {
  static readonly VERSION = '1.0.0';

  static async exportAllData(): Promise<Blob> {
    try {
      const files = await DBUtils.getAllFiles();
      // Get all transcripts by iterating through files
      const allTranscripts: TranscriptRow[] = [];
      const allSegments: Segment[] = [];
      
      for (const file of files) {
        if (file.id) {
          const transcripts = await DBUtils.getTranscriptsByFileId(file.id);
          allTranscripts.push(...transcripts);
          
          for (const transcript of transcripts) {
            if (transcript.id) {
              const segments = await DBUtils.getSegmentsByTranscriptId(transcript.id);
              allSegments.push(...segments);
            }
          }
        }
      }

      const exportData: ExportData = {
        version: this.VERSION,
        exportedAt: new Date().toISOString(),
        files,
        transcripts: allTranscripts,
        segments: allSegments
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      return new Blob([jsonString], { type: 'application/json' });
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async exportFileData(fileId: number): Promise<Blob> {
    try {
      const file = await DBUtils.getFile(fileId);
      if (!file) {
        throw new Error(`File with ID ${fileId} not found`);
      }

      const transcripts = await DBUtils.getTranscriptsByFileId(fileId);
      const segments: Segment[] = [];

      for (const transcript of transcripts) {
        if (transcript.id) {
          const transcriptSegments = await DBUtils.getSegmentsByTranscriptId(transcript.id);
          segments.push(...transcriptSegments);
        }
      }

      const exportData: ExportData = {
        version: this.VERSION,
        exportedAt: new Date().toISOString(),
        files: [file],
        transcripts,
        segments
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      return new Blob([jsonString], { type: 'application/json' });
    } catch (error) {
      console.error('File export failed:', error);
      throw new Error(`Failed to export file data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async importData(file: File): Promise<{
    importedFiles: number;
    importedTranscripts: number;
    importedSegments: number;
  }> {
    try {
      const text = await file.text();
      const data: ExportData = JSON.parse(text);

      // Validate export data
      if (!data.version || !data.files || !data.transcripts || !data.segments) {
        throw new Error('Invalid export file format');
      }

      let importedFiles = 0;
      let importedTranscripts = 0;
      let importedSegments = 0;

      // Import files
      for (const fileData of data.files) {
        try {
          // Remove ID to avoid conflicts
          const { id: _, ...fileWithoutId } = fileData;
          await DBUtils.addFile(fileWithoutId as FileRow);
          importedFiles++;
        } catch (error) {
          console.warn('Failed to import file:', fileData.name, error);
        }
      }

      // Import transcripts
      for (const transcriptData of data.transcripts) {
        try {
          const { id: _, ...transcriptWithoutId } = transcriptData;
          await DBUtils.addTranscript(transcriptWithoutId as TranscriptRow);
          importedTranscripts++;
        } catch (error) {
          console.warn('Failed to import transcript:', error);
        }
      }

      // Import segments
      for (const segmentData of data.segments) {
        try {
          const { id: _, ...segmentWithoutId } = segmentData;
          await DBUtils.addSegment(segmentWithoutId as Segment);
          importedSegments++;
        } catch (error) {
          console.warn('Failed to import segment:', error);
        }
      }

      return {
        importedFiles,
        importedTranscripts,
        importedSegments
      };

    } catch (error) {
      console.error('Import failed:', error);
      throw new Error(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static generateFilename(type: 'all' | 'file', fileId?: number): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    if (type === 'file' && fileId) {
      return `shadowing-learning-file-${fileId}-${timestamp}.json`;
    }
    return `shadowing-learning-backup-${timestamp}.json`;
  }

  static validateImportFile(file: File): boolean {
    const maxSize = 50 * 1024 * 1024; // 50MB
    return file.type === 'application/json' && file.size <= maxSize;
  }
}