import { useCallback, useEffect, useState } from 'react';
import type { AudioPlayerState } from '@/components/types';
import { URLManager } from '@/lib/url-manager';

export interface UseAudioPlayerReturn {
  audioPlayerState: AudioPlayerState;
  audioUrl?: string;
  loopStart?: number;
  loopEnd?: number;
  setAudioFile: (file: File) => void;
  setLoopPoints: (start?: number, end?: number) => void;
  updatePlayerState: (updates: Partial<AudioPlayerState>) => void;
  handleSeek: (time: number) => void;
  clearAudio: () => void;
}

/**
 * Custom hook for managing audio player state and controls
 */
export function useAudioPlayer(): UseAudioPlayerReturn {
  const [audioPlayerState, setAudioPlayerState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
  });

  const [audioUrl, setAudioUrl] = useState<string>();
  const [loopStart, setLoopStart] = useState<number>();
  const [loopEnd, setLoopEnd] = useState<number>();

  // Clean up audio URL on component unmount or when audio changes
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URLManager.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleSeek = useCallback((time: number) => {
    setAudioPlayerState((prev) => ({ ...prev, currentTime: time }));
  }, []);

  // Handle loop playback
  useEffect(() => {
    if (
      loopStart !== undefined &&
      loopEnd !== undefined &&
      audioPlayerState.isPlaying &&
      audioPlayerState.currentTime >= loopEnd
    ) {
      handleSeek(loopStart);
    }
  }, [audioPlayerState.currentTime, audioPlayerState.isPlaying, loopStart, loopEnd, handleSeek]);

  const setAudioFile = useCallback(
    (file: File) => {
      // Clean up previous URL
      if (audioUrl) {
        URLManager.revokeObjectURL(audioUrl);
      }

      const newUrl = URLManager.createObjectURL(file);
      setAudioUrl(newUrl);

      // Reset player state
      setAudioPlayerState({
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 1,
        isMuted: false,
      });
    },
    [audioUrl]
  );

  const setLoopPoints = useCallback((start?: number, end?: number) => {
    setLoopStart(start);
    setLoopEnd(end);
  }, []);

  const updatePlayerState = useCallback((updates: Partial<AudioPlayerState>) => {
    setAudioPlayerState((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearAudio = useCallback(() => {
    if (audioUrl) {
      URLManager.revokeObjectURL(audioUrl);
    }
    setAudioUrl(undefined);
    setLoopStart(undefined);
    setLoopEnd(undefined);
    setAudioPlayerState({
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      isMuted: false,
    });
  }, [audioUrl]);

  return {
    audioPlayerState,
    audioUrl,
    loopStart,
    loopEnd,
    setAudioFile,
    setLoopPoints,
    updatePlayerState,
    handleSeek,
    clearAudio,
  };
}
