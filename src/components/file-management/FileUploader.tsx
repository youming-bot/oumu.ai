"use client";

import { Upload } from "lucide-react";
import React, { useCallback, useId, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  className?: string;
  emptyState?: boolean;
}

export type { FileUploaderProps };

const FileUploader = React.memo<FileUploaderProps>(
  ({
    onFilesSelected,
    isUploading = false,
    uploadProgress = 0,
    className = "",
    emptyState = false,
  }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState<string>("");
    const fileInputId = useId();

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        setError("");

        const files = Array.from(e.dataTransfer.files).filter((file) =>
          file.type.startsWith("audio/"),
        );

        if (files.length > 0) {
          onFilesSelected(files);
        } else {
          setError("请仅拖放音频文件（MP3、WAV、M4A、OGG）");
        }
      },
      [onFilesSelected],
    );

    const handleFileSelect = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []).filter((file) =>
          file.type.startsWith("audio/"),
        );

        if (files.length > 0) {
          onFilesSelected(files);
          setError("");
        } else {
          setError("请仅选择音频文件（MP3、WAV、M4A、OGG）");
        }

        // Clear the input to allow selecting the same file again
        e.target.value = "";
      },
      [onFilesSelected],
    );

    const handleFileInputClick = useCallback(() => {
      document.getElementById(fileInputId)?.click();
    }, [fileInputId]);

    const getUploadAreaStyle = useCallback(() => {
      const baseStyle = `cursor-pointer border-2 border-dashed p-12 text-center transition-all duration-200 ${
        isDragOver
          ? "scale-105 border-green-500 bg-green-50 dark:bg-green-950/20"
          : emptyState
            ? "border-green-300 bg-green-50 hover:scale-[1.02] hover:border-green-400 dark:border-green-700 dark:bg-green-950/10"
            : "border-gray-300 bg-gray-50 hover:scale-[1.02] hover:border-green-400 dark:border-gray-700 dark:bg-gray-900"
      }`;

      return error
        ? `${baseStyle} border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/20`
        : baseStyle;
    }, [isDragOver, emptyState, error]);

    const getUploadTitle = useCallback(() => {
      return emptyState ? "拖放音频文件到此处" : "添加更多文件";
    }, [emptyState]);

    return (
      <div className={className}>
        {/* 上传区域 */}
        <Card
          className={getUploadAreaStyle()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleFileInputClick}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <Label className="cursor-pointer font-medium text-foreground text-lg">
                {getUploadTitle()}
              </Label>
              <p className="text-muted-foreground text-sm">支持的格式：MP3、WAV、M4A、OGG</p>
            </div>
            <input
              id={fileInputId}
              type="file"
              multiple
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </Card>

        {/* 上传进度 */}
        {isUploading && (
          <Card className="mt-4 p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium text-sm">上传中...</Label>
                <span className="text-muted-foreground text-sm">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          </Card>
        )}

        {/* 错误消息 */}
        {error && (
          <div className="mt-4 rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-destructive dark:text-destructive">{error}</p>
          </div>
        )}
      </div>
    );
  },
);

FileUploader.displayName = "FileUploader";

export default FileUploader;
