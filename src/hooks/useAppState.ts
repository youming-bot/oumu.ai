import { useState } from 'react';
import type { FileUploadState, ViewState } from '@/components/types';

export interface UseAppStateReturn {
  viewState: ViewState;
  fileUploadState: FileUploadState;
  isLoading: boolean;
  setViewState: (state: ViewState) => void;
  setFileUploadState: (state: FileUploadState) => void;
  setIsLoading: (loading: boolean) => void;
  updateViewState: (updates: Partial<ViewState>) => void;
  updateFileUploadState: (updates: Partial<FileUploadState>) => void;
}

/**
 * Custom hook for managing general application state
 */
export function useAppState(): UseAppStateReturn {
  const [viewState, setViewState] = useState<ViewState>({
    currentView: 'upload',
    isPlaying: false,
    currentTime: 0,
  });

  const [fileUploadState, setFileUploadState] = useState<FileUploadState>({
    selectedFiles: [],
    isUploading: false,
    uploadProgress: 0,
  });

  const [isLoading, setIsLoading] = useState(false);

  const updateViewState = (updates: Partial<ViewState>) => {
    setViewState((prev) => ({ ...prev, ...updates }));
  };

  const updateFileUploadState = (updates: Partial<FileUploadState>) => {
    setFileUploadState((prev) => ({ ...prev, ...updates }));
  };

  return {
    viewState,
    fileUploadState,
    isLoading,
    setViewState,
    setFileUploadState,
    setIsLoading,
    updateViewState,
    updateFileUploadState,
  };
}
