'use client';

import { File, Upload, X } from 'lucide-react';
import React, { useCallback, useId, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

const FileUpload = React.memo<FileUploadProps>(
  ({ onFilesSelected, isUploading = false, uploadProgress = 0 }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [error, setError] = useState<string>('');
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
        setError('');

        const files = Array.from(e.dataTransfer.files).filter((file) =>
          file.type.startsWith('audio/')
        );

        if (files.length > 0) {
          setSelectedFiles(files);
          onFilesSelected(files);
        } else {
          setError('Please drop audio files only (MP3, WAV, M4A, OGG)');
        }
      },
      [onFilesSelected]
    );

    const handleFileSelect = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []).filter((file) =>
          file.type.startsWith('audio/')
        );

        if (files.length > 0) {
          setSelectedFiles(files);
          onFilesSelected(files);
          setError('');
        } else {
          setError('Please select audio files only (MP3, WAV, M4A, OGG)');
        }

        // Clear the input to allow selecting the same file again
        e.target.value = '';
      },
      [onFilesSelected]
    );

    const removeFile = useCallback(
      (index: number) => {
        setSelectedFiles((prev) => {
          const newFiles = prev.filter((_, i) => i !== index);
          onFilesSelected(newFiles);
          return newFiles;
        });
        setError('');
      },
      [onFilesSelected]
    );

    const handleFileInputClick = useCallback(() => {
      document.getElementById(fileInputId)?.click();
    }, [fileInputId]);

    // Memoize file list rendering for better performance
    const renderedFiles = useMemo(() => {
      return selectedFiles.map((file, index) => (
        <Card key={`${file.name}-${index}-${file.size}`} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <File className="h-5 w-5 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">{file.name}</p>
                <p className="text-muted-foreground text-xs">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeFile(index)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ));
    }, [selectedFiles, removeFile]);

    return (
      <div className="space-y-6">
        {/* Drag and drop area */}
        <Card
          className={`cursor-pointer border-2 border-dashed p-12 text-center transition-all duration-200 ${
            isDragOver
              ? 'scale-105 border-primary bg-primary/10'
              : 'border-border bg-card hover:scale-[1.02] hover:border-primary/50'
          } ${error ? 'border-destructive/50 bg-destructive/5' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleFileInputClick}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <Upload className="h-12 w-12 text-muted-foreground" />
            <div className="space-y-2">
              <Label className="cursor-pointer font-medium text-lg">
                Drop audio files here or click to browse
              </Label>
              <p className="text-muted-foreground text-sm">Supported formats: MP3, WAV, M4A, OGG</p>
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

        {/* Error message */}
        {error && (
          <div className="rounded-lg bg-destructive/10 p-4">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Selected files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg">Selected Files</h3>
              <Badge variant="secondary">{selectedFiles.length} files</Badge>
            </div>
            <div className="space-y-2">{renderedFiles}</div>
          </div>
        )}

        {/* Upload progress */}
        {isUploading && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-medium text-sm">Uploading...</Label>
              <span className="text-muted-foreground text-sm">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}
      </div>
    );
  }
);

FileUpload.displayName = 'FileUpload';

export default FileUpload;
