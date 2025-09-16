import { db, DBUtils } from './db';
import { FileRow } from '@/types/database';

export class FileUploadUtils {
  static async uploadFile(file: File): Promise<number> {
    try {
      if (!file.type.startsWith('audio/')) {
        throw new Error('Only audio files are supported');
      }

      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        throw new Error('File size must be less than 100MB');
      }

      const blob = new Blob([file], { type: file.type });
      
      const fileRow: Omit<FileRow, 'id' | 'createdAt' | 'updatedAt'> = {
        name: file.name,
        size: file.size,
        type: file.type,
        blob: blob,
      };

      const fileId = await DBUtils.addFile(fileRow);
      
      console.log(`File uploaded successfully: ${file.name} (ID: ${fileId})`);
      return fileId;

    } catch (error) {
      console.error('File upload failed:', error);
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getFileBlob(fileId: number): Promise<Blob> {
    try {
      const file = await DBUtils.getFile(fileId);
      if (!file) {
        throw new Error('File not found');
      }
      return file.blob;
    } catch (error) {
      console.error('Failed to get file blob:', error);
      throw error;
    }
  }

  static async getFileUrl(fileId: number): Promise<string> {
    try {
      const blob = await this.getFileBlob(fileId);
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to create file URL:', error);
      throw error;
    }
  }

  static async getAllFiles() {
    try {
      return await DBUtils.getAllFiles();
    } catch (error) {
      console.error('Failed to get files:', error);
      throw error;
    }
  }

  static async deleteFile(fileId: number): Promise<void> {
    try {
      const file = await DBUtils.getFile(fileId);
      if (!file) {
        throw new Error('File not found');
      }

      const transcripts = await DBUtils.getTranscriptsByFileId(fileId);
      
      await db.transaction('rw', db.transcripts, db.segments, async () => {
        for (const transcript of transcripts) {
          if (transcript.id) {
            await DBUtils.deleteTranscript(transcript.id);
          }
        }
        await DBUtils.deleteFile(fileId);
      });

      console.log(`File deleted successfully: ${file.name} (ID: ${fileId})`);

    } catch (error) {
      console.error('File deletion failed:', error);
      throw new Error(`Deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateFileMetadata(
    fileId: number, 
    updates: Partial<Pick<FileRow, 'name' | 'duration'>>
  ): Promise<void> {
    try {
      await DBUtils.updateFile(fileId, updates);
      console.log(`File metadata updated: ${fileId}`);
    } catch (error) {
      console.error('Failed to update file metadata:', error);
      throw error;
    }
  }

  static async getFileInfo(fileId: number) {
    try {
      const file = await DBUtils.getFile(fileId);
      if (!file) {
        throw new Error('File not found');
      }

      const transcripts = await DBUtils.getTranscriptsByFileId(fileId);
      
      return {
        ...file,
        transcripts,
        transcriptCount: transcripts.length,
        hasCompletedTranscript: transcripts.some(t => t.status === 'completed'),
      };
    } catch (error) {
      console.error('Failed to get file info:', error);
      throw error;
    }
  }

  static async validateFile(file: File): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    if (!file.type.startsWith('audio/')) {
      errors.push('Only audio files are supported');
    }

    if (file.size > 100 * 1024 * 1024) {
      errors.push('File size must be less than 100MB');
    }

    if (file.size === 0) {
      errors.push('File is empty');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static async getStorageUsage(): Promise<{
    totalFiles: number;
    totalSize: number;
    averageFileSize: number;
  }> {
    try {
      const files = await DBUtils.getAllFiles();
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      
      return {
        totalFiles: files.length,
        totalSize,
        averageFileSize: files.length > 0 ? totalSize / files.length : 0,
      };
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      throw error;
    }
  }
}