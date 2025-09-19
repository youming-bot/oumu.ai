import { useCallback, useState } from 'react';
import { DbUtils } from '@/lib/db';
import { handleAndShowError } from '@/lib/error-handler';
import type { Segment, TranscriptRow } from '@/types/database';

export interface UseTranscriptsReturn {
  transcripts: TranscriptRow[];
  segments: Segment[];
  isLoading: boolean;
  loadTranscriptsByFileId: (fileId: number) => Promise<void>;
  loadSegmentsByTranscriptId: (transcriptId: number) => Promise<void>;
  clearSegments: () => void;
  clearTranscripts: () => void;
}

/**
 * Custom hook for managing transcript and segment data
 */
export function useTranscripts(): UseTranscriptsReturn {
  const [transcripts, setTranscripts] = useState<TranscriptRow[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTranscriptsByFileId = useCallback(async (fileId: number) => {
    try {
      setIsLoading(true);
      const loadedTranscripts = await DbUtils.getTranscriptsByFileId(fileId);
      setTranscripts(loadedTranscripts);
    } catch (error) {
      handleAndShowError(error, 'loadTranscriptsByFileId');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSegmentsByTranscriptId = useCallback(async (transcriptId: number) => {
    try {
      setIsLoading(true);
      const loadedSegments = await DbUtils.getSegmentsByTranscriptId(transcriptId);
      setSegments(loadedSegments);
    } catch (error) {
      handleAndShowError(error, 'loadSegments');
      setSegments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
  }, []);

  const clearSegments = useCallback(() => {
    setSegments([]);
  }, []);

  // Remove the loadTranscripts method that was calling non-existent getAllTranscripts
  // and remove the useEffect that was calling loadTranscripts on mount

  return {
    transcripts,
    segments,
    isLoading,
    loadTranscriptsByFileId,
    loadSegmentsByTranscriptId,
    clearSegments,
    clearTranscripts,
  };
}
