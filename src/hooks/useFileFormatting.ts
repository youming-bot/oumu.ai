import { AlertCircle, CheckCircle, Clock, Loader } from 'lucide-react';
import React, { useMemo } from 'react';
import type { ProcessingStatus } from '@/types/database';

interface UseFileFormattingReturn {
  formatFileSize: (bytes: number) => string;
  formatDuration: (seconds?: number) => string;
  getStatusIcon: (status: ProcessingStatus) => React.ReactNode;
  getStatusVariant: (
    status: ProcessingStatus
  ) => 'default' | 'secondary' | 'destructive' | 'outline';
  getStatusText: (status: ProcessingStatus) => string;
}

export function useFileFormatting(): UseFileFormattingReturn {
  // 文件大小格式化
  const formatFileSize = useMemo(() => {
    return (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
    };
  }, []);

  // 时长格式化
  const formatDuration = useMemo(() => {
    return (seconds?: number): string => {
      if (!seconds) return '--:--';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
  }, []);

  // 状态图标
  const getStatusIcon = useMemo(() => {
    return (status: ProcessingStatus): React.ReactNode => {
      switch (status) {
        case 'completed':
          return React.createElement(CheckCircle, { className: 'h-3 w-3' });
        case 'processing':
          return React.createElement(Loader, {
            className: 'h-3 w-3 animate-spin',
          });
        case 'failed':
          return React.createElement(AlertCircle, { className: 'h-3 w-3' });
        default:
          return React.createElement(Clock, { className: 'h-3 w-3' });
      }
    };
  }, []);

  // 状态样式变体
  const getStatusVariant = useMemo(() => {
    return (status: ProcessingStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
      switch (status) {
        case 'completed':
          return 'default';
        case 'processing':
          return 'secondary';
        case 'failed':
          return 'destructive';
        default:
          return 'outline';
      }
    };
  }, []);

  // 状态文本
  const getStatusText = useMemo(() => {
    return (status: ProcessingStatus): string => {
      switch (status) {
        case 'completed':
          return 'Completed';
        case 'processing':
          return 'Processing';
        case 'failed':
          return 'Failed';
        default:
          return 'Pending';
      }
    };
  }, []);

  return {
    formatFileSize,
    formatDuration,
    getStatusIcon,
    getStatusVariant,
    getStatusText,
  };
}
