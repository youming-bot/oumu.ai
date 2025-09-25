"use client";

import { File, Filter, Play, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { List } from "react-window";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useFileFormatting } from "@/hooks/useFileFormatting";
import { useFileList } from "@/hooks/useFileList";

import type { FileRow, ProcessingStatus, TranscriptRow } from "@/types/database";

interface VirtualizedFileListProps {
  files: FileRow[];
  transcripts: TranscriptRow[];
  transcriptionProgress?: Map<number, { progress: number; status: string; error?: string }>;
  onPlayFile?: (file: FileRow) => void;
  onDeleteFile?: (fileId: number) => void;
  onRetryTranscription?: (fileId: number) => void;
  isLoading?: boolean;
}

interface VirtualizedFileRowProps {
  data: {
    files: FileRow[];
    transcriptStatusMap: Map<number, ProcessingStatus>;
    selectedFiles: Set<number>;
    transcriptionProgress?: Map<number, { progress: number; status: string; error?: string }>;
    onPlayFile?: (file: FileRow) => void;
    onDeleteFile?: (fileId: number) => void;
    onRetryTranscription?: (fileId: number) => void;
    onSelectFile?: (fileId: number) => void;
    focusedIndex: number;
    setFocusedIndex: (index: number) => void;
  };
  index: number;
  style: React.CSSProperties;
}

// 键盘导航快捷键
const useKeyboardNavigation = (
  _itemCount: number,
  focusedIndex: number,
  setFocusedIndex: (index: number) => void,
  onSelectFile?: (fileId: number) => void,
  onPlayFile?: (file: FileRow) => void,
  onDeleteFile?: (fileId: number) => void,
  files?: FileRow[],
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!files || files.length === 0) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setFocusedIndex(Math.min(focusedIndex + 1, files.length - 1));
          break;
        case "ArrowUp":
          event.preventDefault();
          setFocusedIndex(Math.max(focusedIndex - 1, 0));
          break;
        case "Home":
          event.preventDefault();
          setFocusedIndex(0);
          break;
        case "End":
          event.preventDefault();
          setFocusedIndex(files.length - 1);
          break;
        case " ":
        case "Enter":
          event.preventDefault();
          if (files[focusedIndex]?.id) {
            onSelectFile?.(files[focusedIndex].id);
          }
          break;
        case "p":
        case "P":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            if (files[focusedIndex]?.id) {
              onPlayFile?.(files[focusedIndex]);
            }
          }
          break;
        case "Delete":
        case "Backspace":
          if (event.shiftKey) {
            event.preventDefault();
            if (files[focusedIndex]?.id) {
              onDeleteFile?.(files[focusedIndex].id);
            }
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [focusedIndex, setFocusedIndex, onSelectFile, onPlayFile, onDeleteFile, files]);
};

const VirtualizedFileRow = React.memo<VirtualizedFileRowProps>(({ data, index, style }) => {
  const {
    files,
    transcriptStatusMap,
    selectedFiles,
    transcriptionProgress,
    onPlayFile,
    onDeleteFile,
    onRetryTranscription,
    onSelectFile,
    focusedIndex,
    setFocusedIndex,
  } = data;

  const rowRef = useRef<HTMLDivElement>(null);
  const file = files[index];
  if (!file?.id || !file) return null;

  const isFocused = focusedIndex === index;

  // 自动滚动到聚焦的行
  useEffect(() => {
    if (isFocused && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isFocused]);

  const status = transcriptStatusMap.get(file.id) || "pending";
  const isSelected = selectedFiles.has(file.id);
  const { getStatusIcon, getStatusVariant, getStatusText, formatFileSize, formatDuration } =
    useFileFormatting();

  const handlePlayClick = useCallback(() => {
    onPlayFile?.(file);
  }, [onPlayFile, file]);

  const handleDeleteClick = useCallback(() => {
    if (file?.id) {
      onDeleteFile?.(file.id);
    }
  }, [onDeleteFile, file]);

  const handleSelectClick = useCallback(() => {
    if (file?.id) {
      onSelectFile?.(file.id);
    }
  }, [onSelectFile, file]);

  const handleRetryClick = useCallback(() => {
    if (file?.id) {
      onRetryTranscription?.(file.id);
    }
  }, [onRetryTranscription, file]);

  const handleRowFocus = useCallback(() => {
    setFocusedIndex(index);
  }, [index, setFocusedIndex]);

  const getProgressInfo = useCallback(() => {
    if (!transcriptionProgress || !file.id) return undefined;
    return transcriptionProgress.get(file.id);
  }, [transcriptionProgress, file.id]);

  const getErrorInfo = useCallback(() => {
    const progress = getProgressInfo();
    return progress?.error;
  }, [getProgressInfo]);

  return (
    <div
      ref={rowRef}
      style={style}
      className={`border-b transition-colors duration-200 hover:bg-muted/50 ${
        isFocused ? "bg-muted/70 ring-2 ring-primary" : ""
      } ${isSelected ? "bg-muted/30" : ""}`}
      tabIndex={0}
      onFocus={handleRowFocus}
      aria-selected={isSelected}
      role="row"
      aria-rowindex={index + 1}
    >
      <div className="flex items-center space-x-4 p-4" role="grid">
        {/* 选择框 */}
        <div className="w-12" role="gridcell" aria-colindex={1}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelectClick}
            className="h-4 w-4 rounded border-gray-300"
            aria-label={`选择文件 ${file.name}`}
            tabIndex={-1}
          />
        </div>

        {/* 文件信息 */}
        <div className="min-w-0 flex-1" role="gridcell" aria-colindex={2}>
          <div className="flex items-center space-x-3">
            <File className="h-5 w-5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-sm" aria-label={`文件名: ${file.name}`}>
                {file.name}
              </p>
            </div>
          </div>
        </div>

        {/* 大小 */}
        <div className="w-20" role="gridcell" aria-colindex={3}>
          <span
            className="text-muted-foreground text-sm"
            aria-label={`文件大小: ${file.size ? formatFileSize(file.size) : "未知"}`}
          >
            {file.size !== undefined ? formatFileSize(file.size) : "-"}
          </span>
        </div>

        {/* 时长 */}
        <div className="w-20" role="gridcell" aria-colindex={4}>
          <span
            className="text-muted-foreground text-sm"
            aria-label={`音频时长: ${file.duration ? formatDuration(file.duration) : "未知"}`}
          >
            {file.duration ? formatDuration(file.duration) : "-"}
          </span>
        </div>

        {/* 类型 */}
        <div className="w-24" role="gridcell" aria-colindex={5}>
          <Badge variant="outline" className="capitalize" aria-label={`文件类型: ${file.type}`}>
            {file.type}
          </Badge>
        </div>

        {/* 状态 */}
        <div className="w-32" role="gridcell" aria-colindex={6}>
          <div className="flex flex-col gap-1">
            <Badge variant={getStatusVariant(status)} className="flex w-fit items-center gap-1">
              {getStatusIcon(status)}
              <span className="sr-only">状态:</span>
              {getStatusText(status)}
            </Badge>
            {status === "processing" && (
              <div className="text-muted-foreground text-xs" aria-live="polite">
                {(() => {
                  const progress = getProgressInfo();
                  return progress ? `处理中 ${Math.round(progress.progress)}%` : "开始中...";
                })()}
              </div>
            )}
            {status === "failed" && (
              <div className="text-destructive text-xs" aria-live="polite">
                {(() => {
                  const error = getErrorInfo();
                  return error ? `错误：${error}` : "转录失败";
                })()}
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex w-32 justify-end space-x-2" role="gridcell" aria-colindex={7}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePlayClick}
                  disabled={status !== "completed"}
                  className="h-8 w-8"
                  aria-label={status === "completed" ? "播放文件" : "转录未完成，无法播放"}
                  aria-disabled={status !== "completed"}
                >
                  <Play className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">播放</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{status === "completed" ? "播放文件" : "转录未完成"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {(status === "failed" || status === "pending") && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRetryClick}
                    className="h-8 w-8 text-primary hover:bg-primary/20"
                    aria-label={status === "failed" ? "重试转录" : "开始转录"}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <title>重试</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span className="sr-only">重试</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{status === "failed" ? "重试转录" : "开始转录"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDeleteClick}
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  aria-label="删除文件"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">删除</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>删除文件</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
});

VirtualizedFileRow.displayName = "VirtualizedFileRow";

const VirtualizedFileList = React.memo<VirtualizedFileListProps>(
  ({
    files,
    transcripts,
    transcriptionProgress,
    onPlayFile,
    onDeleteFile,
    onRetryTranscription,
    isLoading = false,
  }) => {
    const [focusedIndex, setFocusedIndex] = useState(0);
    const listRef = useRef<any>(null);

    const {
      selectedFiles,
      searchQuery,
      sortBy,
      sortOrder,
      statusFilter,
      filteredAndSortedFiles,
      transcriptStatusMap,
      setSelectedFiles,
      setSearchQuery,
      setStatusFilter,
      handleSelectAll,
      handleSelectFile,
      handleSort,
    } = useFileList({ files, transcripts });

    // 键盘导航
    useKeyboardNavigation(
      filteredAndSortedFiles.length,
      focusedIndex,
      setFocusedIndex,
      handleSelectFile,
      onPlayFile,
      onDeleteFile,
      filteredAndSortedFiles,
    );

    const handleBatchDelete = useCallback(async () => {
      if (!selectedFiles.size) return;

      if (confirm(`确定要删除选中的 ${selectedFiles.size} 个文件吗？`)) {
        for (const fileId of selectedFiles) {
          if (onDeleteFile) {
            await onDeleteFile(fileId);
          }
        }
        setSelectedFiles(new Set());
      }
    }, [selectedFiles, onDeleteFile, setSelectedFiles]);

    // 缓存列表数据
    const listData = useMemo(
      () => ({
        files: filteredAndSortedFiles,
        transcriptStatusMap,
        selectedFiles,
        transcriptionProgress,
        onPlayFile,
        onDeleteFile,
        onRetryTranscription,
        onSelectFile: handleSelectFile,
        focusedIndex,
        setFocusedIndex,
      }),
      [
        filteredAndSortedFiles,
        transcriptStatusMap,
        selectedFiles,
        transcriptionProgress,
        onPlayFile,
        onDeleteFile,
        onRetryTranscription,
        handleSelectFile,
        focusedIndex,
      ],
    );

    // 虚拟化列表的行高
    const ROW_HEIGHT = 80;

    if (isLoading) {
      return (
        <div className="space-y-4" role="status" aria-busy="true">
          <h3 className="font-medium text-lg">已上传文件</h3>
          <div className="rounded-md border" role="feed" aria-label="正在加载文件列表">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={`skeleton-${i}`} className="flex items-center space-x-4 border-b p-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-6 w-20" />
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (files.length === 0) {
      return (
        <div className="py-12 text-center" role="status">
          <File className="mx-auto mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
          <h3 className="mb-2 font-medium text-lg">尚未上传文件</h3>
          <p className="text-muted-foreground">上传音频文件开始跟读练习。</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-lg">
            文件管理 ({files.length} 个文件)
            <span className="sr-only">使用方向键导航，空格键选择，P键播放，Shift+Delete删除</span>
          </h3>
          {selectedFiles.size > 0 && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">已选择 {selectedFiles.size} 个文件</Badge>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
                aria-label={`删除选中的 ${selectedFiles.size} 个文件`}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                批量删除
              </Button>
            </div>
          )}
        </div>

        {/* 搜索和过滤工具栏 */}
        <Card className="p-4">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <Filter
                className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                placeholder="搜索文件名..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                aria-label="搜索文件名"
              />
            </div>

            {/* 状态过滤 */}
            <div className="flex items-center space-x-2">
              <label htmlFor="status-filter" className="font-medium text-sm">
                状态:
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  if (
                    value === "all" ||
                    ["pending", "processing", "completed", "failed"].includes(value)
                  ) {
                    setStatusFilter(value as ProcessingStatus | "all");
                  }
                }}
                className="rounded-md border border-input bg-background px-3 py-1 text-sm"
                aria-label="按状态过滤"
              >
                <option value="all">全部</option>
                <option value="pending">待处理</option>
                <option value="processing">处理中</option>
                <option value="completed">已完成</option>
                <option value="failed">失败</option>
              </select>
            </div>

            {/* 排序 */}
            <div className="flex items-center space-x-2" role="group" aria-label="排序选项">
              <span className="font-medium text-sm">排序:</span>
              <Button
                variant={sortBy === "name" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleSort("name")}
                aria-label={`按名称排序${sortBy === "name" ? (sortOrder === "asc" ? "升序" : "降序") : ""}`}
                aria-pressed={sortBy === "name"}
              >
                名称 {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
              </Button>
              <Button
                variant={sortBy === "createdAt" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleSort("createdAt")}
                aria-label={`按时间排序${sortBy === "createdAt" ? (sortOrder === "asc" ? "升序" : "降序") : ""}`}
                aria-pressed={sortBy === "createdAt"}
              >
                时间 {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
              </Button>
            </div>
          </div>
        </Card>

        {/* 虚拟化文件列表 */}
        <div className="rounded-md border">
          {filteredAndSortedFiles.length > 0 ? (
            <div role="grid" aria-label="文件列表" aria-rowcount={filteredAndSortedFiles.length}>
              <List
                {...({
                  ref: listRef,
                  height: 600,
                  itemCount: filteredAndSortedFiles.length,
                  itemSize: ROW_HEIGHT,
                  width: "100%",
                  itemData: listData,
                  initialScrollOffset: focusedIndex * ROW_HEIGHT,
                } as any)}
              >
                {VirtualizedFileRow as any}
              </List>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground" role="status">
              <p>没有找到匹配的文件</p>
            </div>
          )}
        </div>
      </div>
    );
  },
);

VirtualizedFileList.displayName = "VirtualizedFileList";

export default VirtualizedFileList;
