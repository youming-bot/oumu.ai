"use client";

import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";

interface FileUploadAreaProps {
  onFilesSelected: (files: File[]) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  className?: string;
}

export default function FileUploadArea({
  onFilesSelected,
  isUploading = false,
  uploadProgress = 0,
  className = "",
}: FileUploadAreaProps) {
  const [_isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setIsDragActive(false);
      onFilesSelected(acceptedFiles);
    },
    [onFilesSelected],
  );

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a", ".ogg", ".flac"],
    },
    multiple: true,
    disabled: isUploading,
    noClick: true, // 禁用默认的点击行为，使用我们自定义的处理
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  const handleFileInputClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length > 0) {
        onFilesSelected(files);
      }
      // 清空input以允许重复选择相同文件
      event.target.value = "";
    },
    [onFilesSelected],
  );

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className="upload-area cursor-pointer"
      >
        <input
          {...getInputProps()}
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <span className="material-symbols-outlined text-6xl text-[var(--text-color)]">
          cloud_upload
        </span>

        <div className="flex flex-col items-center gap-2">
          <p className="text-xl font-bold text-[#4a4a4a] dark:text-[var(--text-color)]">
            拖拽文件到这里
          </p>
          <p className="text-md text-gray-500 dark:text-gray-400">或者</p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={handleFileInputClick}
        >
          <span>选择文件</span>
        </button>
      </div>

      {/* 上传进度指示器 */}
      {isUploading && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            上传中... {uploadProgress}%
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div
              className="bg-[var(--button-color)] h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
