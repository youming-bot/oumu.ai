"use client";

import { Music, Play } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FixedSizeList } from "react-window";
import { Badge } from "@/components/ui/badge";
import type { FileRow, ProcessingStatus, TranscriptRow } from "@/types/database";
import FileCard from "./FileCard";

interface VirtualizedGridProps {
  files: FileRow[];
  transcripts: TranscriptRow[];
  transcriptionProgress?: Map<number, { progress: number; status: string; error?: string }>;
  onPlayFile?: (file: FileRow) => void;
  onDeleteFile?: (fileId: number) => void;
  onRetryTranscription?: (fileId: number) => void;
  isLoading?: boolean;
}

interface VirtualizedRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    files: FileRow[];
    transcriptStatusMap: Map<number, ProcessingStatus>;
    transcriptionProgress?: Map<number, { progress: number; status: string; error?: string }>;
    onPlayFile?: (file: FileRow) => void;
    onDeleteFile?: (fileId: number) => void;
    onRetryTranscription?: (fileId: number) => void;
    itemsPerRow: number;
  };
}

const VirtualizedRow = React.memo<VirtualizedRowProps>(({ index, style, data }) => {
  const {
    files,
    transcriptStatusMap,
    transcriptionProgress,
    onPlayFile,
    onDeleteFile,
    onRetryTranscription,
    itemsPerRow,
  } = data;

  const startIndex = index * itemsPerRow;
  const endIndex = Math.min(startIndex + itemsPerRow, files.length);
  const rowFiles = files.slice(startIndex, endIndex);

  return (
    <div style={style} className="flex space-x-4 p-2">
      {rowFiles.map((file, _colIndex) => {
        if (!file || !file.id) return null;

        const status = transcriptStatusMap.get(file.id) || "pending";

        const getProgressInfo = () => {
          if (!transcriptionProgress || !file.id) return undefined;
          return transcriptionProgress.get(file.id);
        };

        const getErrorInfo = () => {
          const progress = getProgressInfo();
          return progress?.error;
        };

        return (
          <div
            key={file.id}
            className="min-w-0 flex-1"
            style={{ maxWidth: `${100 / itemsPerRow}%` }}
          >
            <FileCard
              file={file}
              status={status}
              onPlay={onPlayFile}
              onDelete={onDeleteFile}
              onRetryTranscription={onRetryTranscription}
              getProgressInfo={getProgressInfo}
              getErrorInfo={getErrorInfo}
            />
          </div>
        );
      })}
    </div>
  );
});

VirtualizedRow.displayName = "VirtualizedRow";

const FileGridVirtualized = React.memo<VirtualizedGridProps>(
  ({
    files,
    transcripts,
    transcriptionProgress,
    onPlayFile,
    onDeleteFile,
    onRetryTranscription,
    isLoading = false,
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [listWidth, setListWidth] = useState<number>(() =>
      typeof window !== "undefined" ? window.innerWidth : 1200,
    );

    useEffect(() => {
      if (typeof window === "undefined") return;

      const updateWidth = () => {
        if (containerRef.current) {
          const width = containerRef.current.clientWidth;
          if (width > 0) {
            setListWidth(width);
            return;
          }
        }
        setListWidth(window.innerWidth);
      };

      updateWidth();
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }, []);

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

    // 计算虚拟化布局
    const virtualLayout = useMemo(() => {
      const rowHeight = 280; // 每行高度

      // 响应式每行项目数
      const getItemsPerRow = () => {
        if (typeof window === "undefined") return 3;
        const width = window.innerWidth;
        if (width < 768) return 1;
        if (width < 1024) return 2;
        return 3;
      };

      const itemsPerRow = getItemsPerRow();
      const rowCount = Math.ceil(files.length / itemsPerRow);

      return {
        itemsPerRow,
        rowCount,
        rowHeight,
      };
    }, [files.length]);

    // 缓存列表数据
    const listData = useMemo(
      () => ({
        files,
        transcriptStatusMap,
        transcriptionProgress,
        onPlayFile,
        onDeleteFile,
        onRetryTranscription,
        itemsPerRow: virtualLayout.itemsPerRow,
      }),
      [
        files,
        transcriptStatusMap,
        transcriptionProgress,
        onPlayFile,
        onDeleteFile,
        onRetryTranscription,
        virtualLayout.itemsPerRow,
      ],
    );

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
      <div ref={containerRef} className="space-y-6">
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

        {/* 虚拟化列表 */}
        {files.length > 0 ? (
          <FixedSizeList
            height={Math.min(800, virtualLayout.rowCount * virtualLayout.rowHeight)}
            itemCount={virtualLayout.rowCount}
            itemSize={virtualLayout.rowHeight}
            width={listWidth}
            itemData={listData as unknown as Record<string, unknown>}
          >
            {VirtualizedRow as any}
          </FixedSizeList>
        ) : (
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

FileGridVirtualized.displayName = "FileGridVirtualized";

export default FileGridVirtualized;
