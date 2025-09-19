import { useCallback, useEffect, useState } from 'react';
import { handleAndShowError } from '@/lib/error-handler';
import { FileUploadUtils } from '@/lib/file-upload';
import type { FileRow } from '@/types/database';

export interface UseFilesReturn {
  files: FileRow[];
  isLoading: boolean;
  loadFiles: () => Promise<void>;
  refreshFiles: () => Promise<void>;
}

/**
 * Custom hook for managing file data
 */
export function useFiles(): UseFilesReturn {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const loadedFiles = await FileUploadUtils.getAllFiles();
      setFiles(loadedFiles);
    } catch (error) {
      handleAndShowError(error, 'loadFiles');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshFiles = useCallback(async () => {
    await loadFiles();
  }, [loadFiles]);

  // Load files on mount
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  return {
    files,
    isLoading,
    loadFiles,
    refreshFiles,
  };
}
