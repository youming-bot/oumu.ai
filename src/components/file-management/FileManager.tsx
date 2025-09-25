"use client";

import React, { useMemo } from "react";
import type { FileRow, TranscriptRow } from "@/types/database";
import FileGrid from "./FileGrid";
import FileGridVirtualized from "./FileGridVirtualized";
import FileUploader from "./FileUploader";

interface FileManagerProps {
  files: FileRow[];
  transcripts: TranscriptRow[];
  transcriptionProgress?: Map<number, { progress: number; status: string; error?: string }>;
  onFilesSelected: (files: File[]) => void;
  onPlayFile?: (file: FileRow) => void;
  onDeleteFile?: (fileId: number) => void;
  onRetryTranscription?: (fileId: number) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  isLoading?: boolean;
}

export type { FileManagerProps };

const FileManager = React.memo<FileManagerProps>(
  ({
    files,
    transcripts,
    transcriptionProgress,
    onFilesSelected,
    onPlayFile,
    onDeleteFile,
    onRetryTranscription,
    isUploading = false,
    uploadProgress = 0,
    isLoading = false,
  }) => {
    // 确定是否显示空状态的上传区域
    const showEmptyStateUploader = useMemo(() => {
      return files.length === 0 && !isUploading && !isLoading;
    }, [files.length, isUploading, isLoading]);

    // 确定是否显示添加更多文件的上传区域
    const showAddMoreUploader = useMemo(() => {
      return files.length > 0 && !isUploading && !isLoading;
    }, [files.length, isUploading, isLoading]);

    // 根据文件数量选择是否使用虚拟化
    const useVirtualizedGrid = useMemo(() => {
      return files.length > 20; // 超过20个文件时使用虚拟化
    }, [files.length]);

    return (
      <div className="min-h-screen space-y-6 rounded-lg bg-background p-6">
        {/* 空状态上传区域 */}
        {showEmptyStateUploader && (
          <FileUploader
            onFilesSelected={onFilesSelected}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            emptyState={true}
          />
        )}

        {/* 文件网格展示 */}
        {useVirtualizedGrid ? (
          <FileGridVirtualized
            files={files}
            transcripts={transcripts}
            transcriptionProgress={transcriptionProgress}
            onPlayFile={onPlayFile}
            onDeleteFile={onDeleteFile}
            onRetryTranscription={onRetryTranscription}
            isLoading={isLoading}
          />
        ) : (
          <FileGrid
            files={files}
            transcripts={transcripts}
            transcriptionProgress={transcriptionProgress}
            onPlayFile={onPlayFile}
            onDeleteFile={onDeleteFile}
            onRetryTranscription={onRetryTranscription}
            isLoading={isLoading}
          />
        )}

        {/* 添加更多文件上传区域 */}
        {showAddMoreUploader && (
          <FileUploader
            onFilesSelected={onFilesSelected}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            emptyState={false}
          />
        )}
      </div>
    );
  },
);

FileManager.displayName = "FileManager";

export default FileManager;
