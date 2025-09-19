'use client';

import { File, Filter, Play, Square, Trash2 } from 'lucide-react';
import React, { useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useFileFormatting } from '@/hooks/useFileFormatting';
import { useFileList } from '@/hooks/useFileList';

import type { FileRow, ProcessingStatus, TranscriptRow } from '@/types/database';

interface FileRowProps {
  file: FileRow;
  status: ProcessingStatus;
  isSelected?: boolean;
  onSelect?: (fileId: number) => void;
  onPlay?: (file: FileRow) => void;
  onDelete?: (fileId: number) => void;
  getProgressInfo?: (
    fileId: number
  ) => { progress: number; status: string; error?: string } | undefined;
  getErrorInfo?: (fileId: number) => string | undefined;
}

const FileRowComponent = React.memo<FileRowProps>(
  ({
    file,
    status,
    isSelected = false,
    onSelect,
    onPlay,
    onDelete,
    getProgressInfo,
    getErrorInfo,
  }) => {
    const handlePlayClick = useCallback(() => {
      onPlay?.(file);
    }, [onPlay, file]);

    const handleDeleteClick = useCallback(() => {
      if (file.id) {
        onDelete?.(file.id);
      }
    }, [onDelete, file.id]);

    const handleSelectClick = useCallback(() => {
      if (file.id && onSelect) {
        onSelect(file.id);
      }
    }, [onSelect, file.id]);

    const { getStatusIcon, getStatusVariant, getStatusText, formatFileSize, formatDuration } =
      useFileFormatting();

    if (!file.id) return null;

    return (
      <TableRow key={file.id} className={`hover:bg-muted/50 ${isSelected ? 'bg-muted/30' : ''}`}>
        <TableCell>
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleSelectClick}
              className="h-4 w-4 rounded border-gray-300"
            />
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center space-x-3">
            <File className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate font-medium text-sm">{file.name}</p>
            </div>
          </div>
        </TableCell>

        <TableCell>
          <span className="text-muted-foreground text-sm">{formatFileSize(file.size)}</span>
        </TableCell>

        <TableCell>
          <span className="text-muted-foreground text-sm">
            {file.duration ? formatDuration(file.duration) : '-'}
          </span>
        </TableCell>

        <TableCell>
          <Badge variant="outline" className="capitalize">
            {file.type}
          </Badge>
        </TableCell>

        <TableCell>
          <div className="flex flex-col gap-1">
            <Badge variant={getStatusVariant(status)} className="flex w-fit items-center gap-1">
              {getStatusIcon(status)}
              {getStatusText(status)}
            </Badge>
            {status === 'processing' && file.id && (
              <div className="text-muted-foreground text-xs">
                {(() => {
                  const progress = getProgressInfo?.(file.id);
                  return progress ? `${Math.round(progress.progress)}%` : 'Starting...';
                })()}
              </div>
            )}
            {status === 'failed' && file.id && (
              <div className="text-destructive text-xs">
                {(() => {
                  const error = getErrorInfo?.(file.id);
                  return error ? `Error: ${error}` : 'Transcription failed';
                })()}
              </div>
            )}
          </div>
        </TableCell>

        <TableCell className="text-right">
          <div className="flex justify-end space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePlayClick}
                    disabled={status !== 'completed'}
                    className="h-8 w-8"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{status === 'completed' ? 'Play file' : 'Processing not complete'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDeleteClick}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete file</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableCell>
      </TableRow>
    );
  }
);

FileRowComponent.displayName = 'FileRowComponent';

interface FileListProps {
  files: FileRow[];
  transcripts: TranscriptRow[];
  transcriptionProgress?: Map<number, { progress: number; status: string; error?: string }>;
  onPlayFile?: (file: FileRow) => void;
  onDeleteFile?: (fileId: number) => void;
  isLoading?: boolean;
}

const FileList = React.memo<FileListProps>(
  ({ files, transcripts, transcriptionProgress, onPlayFile, onDeleteFile, isLoading = false }) => {
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

    const getTranscriptStatus = useCallback(
      (fileId: number): ProcessingStatus => {
        return transcriptStatusMap.get(fileId) || 'pending';
      },
      [transcriptStatusMap]
    );

    const getProgressInfo = useCallback(
      (fileId: number) => {
        if (!transcriptionProgress || !fileId) return undefined;
        return transcriptionProgress.get(fileId) || undefined;
      },
      [transcriptionProgress]
    );

    const getErrorInfo = useCallback(
      (fileId: number) => {
        const progress = getProgressInfo(fileId);
        return progress?.error;
      },
      [getProgressInfo]
    );

    const handleBatchDelete = useCallback(async () => {
      if (selectedFiles.size === 0) return;

      if (confirm(`确定要删除选中的 ${selectedFiles.size} 个文件吗？`)) {
        for (const fileId of selectedFiles) {
          await onDeleteFile?.(fileId);
        }
        setSelectedFiles(new Set());
      }
    }, [selectedFiles, onDeleteFile, setSelectedFiles]);

    if (isLoading) {
      return (
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Uploaded Files</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3].map((i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-5 w-5 rounded" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      );
    }

    if (files.length === 0) {
      return (
        <div className="py-12 text-center">
          <File className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 font-medium text-lg">No files uploaded</h3>
          <p className="text-muted-foreground">
            Upload audio files to get started with shadowing practice.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-lg">文件管理 ({files.length} 个文件)</h3>
          {selectedFiles.size > 0 && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">已选择 {selectedFiles.size} 个文件</Badge>
              <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
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
              <Filter className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索文件名..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 状态过滤 */}
            <div className="flex items-center space-x-2">
              <span className="font-medium text-sm">状态:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ProcessingStatus | 'all')}
                className="rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="all">全部</option>
                <option value="pending">待处理</option>
                <option value="processing">处理中</option>
                <option value="completed">已完成</option>
                <option value="failed">失败</option>
              </select>
            </div>

            {/* 排序 */}
            <div className="flex items-center space-x-2">
              <span className="font-medium text-sm">排序:</span>
              <Button
                variant={sortBy === 'name' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleSort('name')}
              >
                名称 {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortBy === 'createdAt' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleSort('createdAt')}
              >
                时间 {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
            </div>
          </div>
        </Card>

        {/* 文件列表表格 */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="h-6 w-6 p-0"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>文件</TableHead>
                <TableHead>大小</TableHead>
                <TableHead>时长</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedFiles.map((file) => {
                if (!file.id) return null;
                const status = getTranscriptStatus(file.id);
                const isSelected = selectedFiles.has(file.id);

                return (
                  <FileRowComponent
                    key={file.id}
                    file={file}
                    status={status}
                    isSelected={isSelected}
                    onSelect={handleSelectFile}
                    onPlay={onPlayFile}
                    onDelete={onDeleteFile}
                    getProgressInfo={getProgressInfo}
                    getErrorInfo={getErrorInfo}
                  />
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filteredAndSortedFiles.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            <p>没有找到匹配的文件</p>
          </div>
        )}
      </div>
    );
  }
);

FileList.displayName = 'FileList';

export default FileList;
