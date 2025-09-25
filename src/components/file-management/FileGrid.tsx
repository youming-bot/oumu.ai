"use client";

import { Music, Play } from "lucide-react";
import React, { useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import type { FileRow, ProcessingStatus, TranscriptRow } from "@/types/database";
import FileCard from "./FileCard";

interface FileGridProps {
  files: FileRow[];
  transcripts: TranscriptRow[];
  transcriptionProgress?: Map<number, { progress: number; status: string; error?: string }>;
  onPlayFile?: (file: FileRow) => void;
  onDeleteFile?: (fileId: number) => void;
  onRetryTranscription?: (fileId: number) => void;
  isLoading?: boolean;
}

export type { FileGridProps };

const FileGrid = React.memo<FileGridProps>(
  ({
    files,
    transcripts,
    transcriptionProgress,
    onPlayFile,
    onDeleteFile,
    onRetryTranscription,
    isLoading = false,
  }) => {
    // 创建转录状态映射
    const transcriptStatusMap = useMemo(() => {
      const statusMap = new Map<number, ProcessingStatus>();
      if (transcripts) {
        transcripts.forEach((transcript) => {
          if (transcript.fileId) {
            statusMap.set(transcript.fileId, transcript.status as ProcessingStatus);
          }
        });
      }
      return statusMap;
    }, [transcripts]);

    const getTranscriptStatus = useCallback(
      (fileId: number): ProcessingStatus => {
        // 优先使用 transcriptionProgress 中的状态（实时）
        if (transcriptionProgress?.has(fileId)) {
          const progress = transcriptionProgress.get(fileId);
          if (progress) {
            // 将 transcriptionProgress 中的状态转换为 ProcessingStatus
            switch (progress.status) {
              case "processing":
              case "idle":
                return "processing";
              case "completed":
                return "completed";
              case "failed":
              case "error":
                return "failed";
              default:
                return "processing";
            }
          }
        }

        // 如果 transcriptionProgress 中没有，则使用数据库中的状态
        return transcriptStatusMap.get(fileId) || "pending";
      },
      [transcriptStatusMap, transcriptionProgress],
    );

    const getProgressInfo = useCallback(
      (fileId: number) => {
        if (!transcriptionProgress || !fileId) return undefined;
        return transcriptionProgress.get(fileId) || undefined;
      },
      [transcriptionProgress],
    );

    const getErrorInfo = useCallback(
      (fileId: number) => {
        const progress = getProgressInfo(fileId);
        return progress?.error;
      },
      [getProgressInfo],
    );

    // 统计各状态文件数量
    const statusCounts = useMemo(() => {
      return {
        total: files.length,
        completed: files.filter((file) => getTranscriptStatus(file.id || 0) === "completed").length,
        processing: files.filter((file) => getTranscriptStatus(file.id || 0) === "processing")
          .length,
        pending: files.filter((file) => getTranscriptStatus(file.id || 0) === "pending").length,
        failed: files.filter((file) => getTranscriptStatus(file.id || 0) === "failed").length,
      };
    }, [files, getTranscriptStatus]);

    if (isLoading) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={`skeleton-${i}`} className="rounded-lg border p-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
                    <div className="flex-1">
                      <div className="mb-2 h-4 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* 页面标题和统计信息 */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mt-2 flex items-center space-x-4">
              <Badge variant="outline" className="text-xs">
                <Music className="mr-1 h-3 w-3" />
                总计 {statusCounts.total} 个文件
              </Badge>
              {statusCounts.completed > 0 && (
                <Badge variant="secondary" className="bg-primary-light text-primary text-xs">
                  <Play className="mr-1 h-3 w-3" />
                  {statusCounts.completed} 个可播放
                </Badge>
              )}
              {statusCounts.processing > 0 && (
                <Badge variant="secondary" className="bg-primary-light text-primary text-xs">
                  处理中 {statusCounts.processing}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* 文件卡片网格 */}
        {files.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {files.map((file) => {
              const status = getTranscriptStatus(file.id || 0);
              return (
                <FileCard
                  key={file.id}
                  file={file}
                  status={status}
                  onPlay={onPlayFile}
                  onDelete={onDeleteFile}
                  onRetryTranscription={onRetryTranscription}
                  getProgressInfo={getProgressInfo}
                  getErrorInfo={getErrorInfo}
                />
              );
            })}
          </div>
        )}

        {/* 空状态 */}
        {files.length === 0 && (
          <div className="py-12 text-center">
            <Music className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-medium text-lg">尚未上传文件</h3>
            <p className="text-muted-foreground">上传音频文件开始跟读练习。</p>
          </div>
        )}
      </div>
    );
  },
);

FileGrid.displayName = "FileGrid";

export default FileGrid;
