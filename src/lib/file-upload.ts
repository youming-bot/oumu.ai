import type { FileRow } from '@/types/database';
import { DbUtils } from './db';
import { URLManager } from './url-manager';

export async function uploadFile(file: File): Promise<number> {
  try {
    if (!file.type.startsWith('audio/')) {
      throw new Error('Only audio files are supported');
    }

    if (file.size > 100 * 1024 * 1024) {
      throw new Error('File size must be less than 100MB');
    }
    const blob = new Blob([file], { type: file.type });

    const fileRow: Omit<FileRow, 'id' | 'createdAt' | 'updatedAt'> = {
      name: file.name,
      size: file.size,
      type: file.type,
      blob: blob,
    };
    const fileId = await DbUtils.addFile(fileRow);

    return fileId;
  } catch (error) {
    throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getFileBlob(fileId: number): Promise<Blob> {
  const file = await DbUtils.getFile(fileId);
  if (!file) {
    throw new Error('File not found');
  }
  return file.blob;
}

export async function getFileUrl(fileId: number): Promise<string> {
  const blob = await getFileBlob(fileId);
  // 使用临时URL，5分钟后自动清理
  return URLManager.createTemporaryURL(blob, 5 * 60 * 1000);
}

export async function getAllFiles() {
  return await DbUtils.getAllFiles();
}

export async function deleteFile(fileId: number): Promise<void> {
  try {
    const file = await DbUtils.getFile(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    // Use the new transactional delete method
    await DbUtils.deleteFileWithDependencies(fileId);
  } catch (error) {
    throw new Error(`Deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateFileMetadata(
  fileId: number,
  updates: Partial<Pick<FileRow, 'name' | 'duration'>>
): Promise<void> {
  await DbUtils.updateFile(fileId, updates);
}

export async function getFileInfo(fileId: number) {
  const file = await DbUtils.getFile(fileId);
  if (!file) {
    throw new Error('File not found');
  }

  const transcripts = await DbUtils.getTranscriptsByFileId(fileId);

  return {
    ...file,
    transcripts,
    transcriptCount: transcripts.length,
    hasCompletedTranscript: transcripts.some((t) => t.status === 'completed'),
  };
}

export async function validateFile(file: File): Promise<{
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

export async function getStorageUsage(): Promise<{
  totalFiles: number;
  totalSize: number;
  averageFileSize: number;
}> {
  const files = await DbUtils.getAllFiles();
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  return {
    totalFiles: files.length,
    totalSize,
    averageFileSize: files.length > 0 ? totalSize / files.length : 0,
  };
}

// 为了向后兼容，保留类作为函数的包装器
export const FileUploadUtils = {
  uploadFile,
  getFileBlob,
  getFileUrl,
  getAllFiles,
  deleteFile,
  updateFileMetadata,
  getFileInfo,
  validateFile,
  getStorageUsage,
};
