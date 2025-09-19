'use client';

/**
 * 状态选择器工具 - 用于优化组件渲染性能
 */

/**
 * 状态选择器工具 - 用于优化组件渲染性能
 */

import React, { useMemo } from 'react';
import type { AppState } from '@/contexts/app-context';
import { useApp } from '@/contexts/app-context';
import type { FileRow, Segment, Term, TranscriptRow } from '@/types/database';

// 基础选择器类型
type Selector<T, R> = (state: T) => R;

/**
 * 创建记忆化选择器
 */
export function createSelector<T, R>(selector: Selector<T, R>): (state: T) => R {
  let lastState: T | undefined;
  let lastResult: R | undefined;

  return (state: T) => {
    if (lastState === state && lastResult !== undefined) {
      return lastResult;
    }
    lastState = state;
    lastResult = selector(state);
    return lastResult;
  };
}

// 预定义的应用状态选择器
export const appSelectors = {
  // 文件选择器
  selectFiles: createSelector((state: AppState) => state.files),
  selectCurrentFile: createSelector((state: AppState) => state.currentFile),
  selectProcessingFiles: createSelector((state: AppState) =>
    state.files.filter((f: FileRow) =>
      state.transcripts.some((t: TranscriptRow) => t.fileId === f.id && t.status === 'processing')
    )
  ),
  selectCompletedFiles: createSelector((state: AppState) =>
    state.files.filter((f: FileRow) =>
      state.transcripts.some((t: TranscriptRow) => t.fileId === f.id && t.status === 'completed')
    )
  ),

  // 转录选择器
  selectTranscripts: createSelector((state: AppState) => state.transcripts),
  selectCurrentTranscript: createSelector((state: AppState) => state.currentTranscript),
  selectSegments: createSelector((state: AppState) => state.segments),

  // 术语选择器
  selectTerms: createSelector((state: AppState) => state.terms),

  // 音频播放器选择器
  selectIsPlaying: createSelector((state: AppState) => state.audioPlayer.isPlaying),
  selectCurrentTime: createSelector((state: AppState) => state.audioPlayer.currentTime),
  selectDuration: createSelector((state: AppState) => state.audioPlayer.duration),

  // UI 选择器
  selectUi: (state: AppState) => state.ui,
  selectSidebarOpen: createSelector((state: AppState) => state.ui.sidebarOpen),
  selectDarkMode: createSelector((state: AppState) => state.ui.darkMode),
};

/**
 * 使用选择器的hook
 */
export function useSelector<R>(selector: Selector<AppState, R>): R {
  const { state } = useApp();
  return useMemo(() => selector(state), [state, selector]);
}

export function useFiles() {
  const files = useSelector(appSelectors.selectFiles);
  const processingFiles = useSelector(appSelectors.selectProcessingFiles);
  const completedFiles = useSelector(appSelectors.selectCompletedFiles);

  return {
    files,
    processingFiles,
    completedFiles,
    totalFiles: files.length,
    processingCount: processingFiles.length,
    completedCount: completedFiles.length,
  };
}

export function useCurrentFileData() {
  const currentFile = useSelector((state: AppState) => state.currentFile);
  const transcripts = useSelector((state: AppState) => state.transcripts);
  const currentTranscript = useSelector((state: AppState) => state.currentTranscript);
  const segments = useSelector((state: AppState) => state.segments);

  const currentFileData = currentFile
    ? {
        ...currentFile,
        transcripts: transcripts.filter((t: TranscriptRow) => t.fileId === currentFile.id),
      }
    : null;

  const currentTranscriptData = currentTranscript
    ? {
        ...currentTranscript,
        segments: segments
          .filter((s: Segment) => s.transcriptId === currentTranscript.id)
          .sort((a: Segment, b: Segment) => a.start - b.start),
      }
    : null;

  return {
    currentFile: currentFileData,
    currentTranscript: currentTranscriptData,
    hasCurrentFile: !!currentFileData,
    hasCurrentTranscript: !!currentTranscriptData,
  };
}

export function useTerminology() {
  const terms = useSelector(appSelectors.selectTerms);

  const termsByCategory = (category: string) => {
    return terms.filter((term: Term) => term.category === category);
  };

  return {
    terms,
    termsByCategory,
    totalTerms: terms.length,
    categories: Array.from(new Set(terms.map((term: Term) => term.category).filter(Boolean))),
  };
}

export function useAudioPlayerState() {
  const isPlaying = useSelector(appSelectors.selectIsPlaying);
  const currentTime = useSelector(appSelectors.selectCurrentTime);
  const duration = useSelector(appSelectors.selectDuration);

  return {
    isPlaying,
    currentTime,
    duration,
    progress: duration > 0 ? (currentTime / duration) * 100 : 0,
  };
}

export function useSegmentNavigation() {
  const currentTranscript = useSelector((state: AppState) => state.currentTranscript);
  const segments = useSelector((state: AppState) => state.segments);
  const currentTime = useSelector(appSelectors.selectCurrentTime);

  const currentTranscriptData = currentTranscript
    ? {
        ...currentTranscript,
        segments: segments
          .filter((s: Segment) => s.transcriptId === currentTranscript.id)
          .sort((a: Segment, b: Segment) => a.start - b.start),
      }
    : null;

  const currentSegment = React.useMemo(() => {
    if (!currentTranscriptData?.segments || !currentTime) return null;

    return currentTranscriptData.segments.find(
      (segment: Segment) => currentTime >= segment.start && currentTime <= segment.end
    );
  }, [currentTranscriptData?.segments, currentTime]);

  const nextSegment = React.useMemo(() => {
    if (!currentTranscriptData?.segments || !currentSegment) return null;

    const currentIndex = currentTranscriptData.segments.indexOf(currentSegment);
    return currentTranscriptData.segments[currentIndex + 1] || null;
  }, [currentTranscriptData?.segments, currentSegment]);

  const previousSegment = React.useMemo(() => {
    if (!currentTranscriptData?.segments || !currentSegment) return null;

    const currentIndex = currentTranscriptData.segments.indexOf(currentSegment);
    return currentTranscriptData.segments[currentIndex - 1] || null;
  }, [currentTranscriptData?.segments, currentSegment]);

  return {
    currentSegment,
    nextSegment,
    previousSegment,
    hasCurrentSegment: !!currentSegment,
    hasNextSegment: !!nextSegment,
    hasPreviousSegment: !!previousSegment,
  };
}
