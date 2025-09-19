import { useCallback, useState } from 'react';

export type AbLoopMode = 'idle' | 'setting-a' | 'setting-b';

export interface UseAbLoopProps {
  currentTime: number;
  duration: number;
  formatTime: (seconds: number) => string;
  parseTimeInput: (input: string) => number;
  onSetAbLoop?: (start: number, end: number) => void;
  onClearAbLoop?: () => void;
}

export interface UseAbLoopReturn {
  abLoopMode: AbLoopMode;
  customLoopStart: string;
  customLoopEnd: string;
  handleAbLoopSet: () => void;
  handleAbLoopClear: () => void;
  handleCustomLoopApply: () => void;
  setCustomLoopStart: (value: string) => void;
  setCustomLoopEnd: (value: string) => void;
  getAbLoopStatus: string;
}

export function useAbLoop({
  currentTime,
  duration,
  formatTime,
  parseTimeInput,
  onSetAbLoop,
  onClearAbLoop,
}: UseAbLoopProps): UseAbLoopReturn {
  const [abLoopMode, setAbLoopMode] = useState<AbLoopMode>('idle');
  const [customLoopStart, setCustomLoopStart] = useState('');
  const [customLoopEnd, setCustomLoopEnd] = useState('');

  const handleAbLoopSet = useCallback(() => {
    if (abLoopMode === 'idle') {
      setAbLoopMode('setting-a');
      setCustomLoopStart(formatTime(currentTime));
    } else if (abLoopMode === 'setting-a') {
      setAbLoopMode('setting-b');
      setCustomLoopEnd(formatTime(currentTime));
    } else if (abLoopMode === 'setting-b') {
      const startTime = parseTimeInput(customLoopStart);
      const endTime = parseTimeInput(customLoopEnd);
      if (startTime < endTime && endTime <= duration) {
        onSetAbLoop?.(startTime, endTime);
      }
      setAbLoopMode('idle');
    }
  }, [
    abLoopMode,
    currentTime,
    customLoopStart,
    customLoopEnd,
    duration,
    onSetAbLoop,
    formatTime,
    parseTimeInput,
  ]);

  const handleAbLoopClear = useCallback(() => {
    onClearAbLoop?.();
    setAbLoopMode('idle');
    setCustomLoopStart('');
    setCustomLoopEnd('');
  }, [onClearAbLoop]);

  const handleCustomLoopApply = useCallback(() => {
    const startTime = parseTimeInput(customLoopStart);
    const endTime = parseTimeInput(customLoopEnd);
    if (startTime < endTime && endTime <= duration) {
      onSetAbLoop?.(startTime, endTime);
    }
  }, [customLoopStart, customLoopEnd, duration, onSetAbLoop, parseTimeInput]);

  const getAbLoopStatus = (() => {
    if (abLoopMode === 'setting-a') return '设置A点...';
    if (abLoopMode === 'setting-b') return '设置B点...';
    return '点击设置A-B循环';
  })();

  return {
    abLoopMode,
    customLoopStart,
    customLoopEnd,
    handleAbLoopSet,
    handleAbLoopClear,
    handleCustomLoopApply,
    setCustomLoopStart,
    setCustomLoopEnd,
    getAbLoopStatus,
  };
}
