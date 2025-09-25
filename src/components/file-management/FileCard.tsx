"use client";

import { Music, Play, RefreshCw, X } from "lucide-react";
import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useFileFormatting } from "@/hooks/useFileFormatting";
import type { FileRow, ProcessingStatus } from "@/types/database";

interface FileCardProps {
  file: FileRow;
  status: ProcessingStatus;
  onPlay?: (file: FileRow) => void;
  onDelete?: (fileId: number) => void;
  onRetryTranscription?: (fileId: number) => void;
  getProgressInfo?: (
    fileId: number,
  ) => { progress: number; status: string; error?: string } | undefined;
  getErrorInfo?: (fileId: number) => string | undefined;
}

export type { FileCardProps };

const FileCard = React.memo<FileCardProps>(
  ({ file, status, onPlay, onDelete, onRetryTranscription, getProgressInfo, getErrorInfo }) => {
    const handlePlayClick = useCallback(() => {
      onPlay?.(file);
    }, [onPlay, file]);

    const handleDeleteClick = useCallback(() => {
      if (file.id) {
        onDelete?.(file.id);
      }
    }, [onDelete, file.id]);

    const handleRetryClick = useCallback(() => {
      if (file.id && onRetryTranscription) {
        onRetryTranscription(file.id);
      }
    }, [onRetryTranscription, file.id]);

    const { getStatusIcon, getStatusText, formatFileSize, formatDuration } = useFileFormatting();

    const progressInfo = file.id ? getProgressInfo?.(file.id) : undefined;
    const errorInfo = file.id ? getErrorInfo?.(file.id) : undefined;

    // 状态颜色映射
    const getStatusColor = useCallback((status: ProcessingStatus) => {
      switch (status) {
        case "completed":
          return "text-primary";
        case "processing":
          return "text-primary";
        case "failed":
          return "text-destructive";
        case "pending":
          return "text-muted-foreground";
        default:
          return "text-muted-foreground";
      }
    }, []);

    // 状态背景颜色映射
    const getStatusBgColor = useCallback((status: ProcessingStatus) => {
      switch (status) {
        case "completed":
          return "bg-primary/20 dark:bg-primary/30";
        case "processing":
          return "bg-primary/20 dark:bg-primary/20";
        case "failed":
          return "bg-destructive/10 dark:bg-destructive/20";
        case "pending":
          return "bg-muted/20 dark:bg-muted/30";
        default:
          return "bg-muted/20 dark:bg-muted/30";
      }
    }, []);

    if (!file.id) return null;

    return (
      <Card
        className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 border-transparent transition-all duration-200 hover:scale-[1.02] hover:border-primary/30 hover:shadow-lg ${
          status === "completed" ? "bg-green-50 dark:bg-green-950/20" : ""
        }`}
        onClick={status === "completed" ? handlePlayClick : undefined}
      >
        {/* 卡片内容 */}
        <div className="space-y-3 p-4">
          {/* 文件头部信息 */}
          <div className="flex items-start justify-between">
            <div className="flex min-w-0 flex-1 items-center space-x-3">
              <div className={`rounded-lg p-2 ${getStatusBgColor(status)}`}>
                <Music className={`h-5 w-5 ${getStatusColor(status)}`} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate pr-2 font-medium text-foreground text-sm">{file.name}</h3>
                <div className="mt-1 flex items-center space-x-2">
                  <span className="text-muted-foreground text-xs">{formatFileSize(file.size)}</span>
                  {file.duration && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground text-xs">
                        {formatDuration(file.duration)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
              {status === "completed" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayClick();
                  }}
                  className="h-8 w-8"
                >
                  <Play className="h-4 w-4" />
                </Button>
              )}

              {(status === "failed" || status === "pending") && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRetryClick();
                  }}
                  className="h-8 w-8 text-primary"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick();
                }}
                className="h-8 w-8 text-red-600 dark:text-red-400"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 状态信息 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(status)}
              <span className={`font-medium text-xs ${getStatusColor(status)}`}>
                {getStatusText(status)}
              </span>
            </div>

            {status === "processing" && progressInfo && (
              <div className="flex items-center space-x-2">
                <div className="h-1.5 w-16 rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${progressInfo.progress}%` }}
                  />
                </div>
                <span className="text-gray-500 text-xs dark:text-gray-400">
                  {Math.round(progressInfo.progress)}%
                </span>
              </div>
            )}
          </div>

          {/* 错误信息 */}
          {status === "failed" && errorInfo && (
            <div className="rounded bg-destructive/10 p-2 text-destructive text-xs">
              {errorInfo}
            </div>
          )}
        </div>

        {/* 底部装饰线 - Duolingo风格，底部边框更粗 */}
        <div className={`h-3 w-full ${getStatusBgColor(status)} border-current/20 border-b-4`} />
      </Card>
    );
  },
);

FileCard.displayName = "FileCard";

export default FileCard;
