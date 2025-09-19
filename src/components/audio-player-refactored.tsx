'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import AbLoopInput from '@/components/ab-loop-input';
import AudioControls from '@/components/audio-controls';
import KeyboardShortcutsHelp from '@/components/keyboard-shortcuts-help';
import LoopControls from '@/components/loop-controls';
import PlaybackSpeedControl from '@/components/playback-speed-control';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import VolumeControl from '@/components/volume-control';
import WaveformDisplay from '@/components/waveform-display';
import { useAbLoop } from '@/hooks/useAbLoop';
import { useAudioPlayerState } from '@/hooks/useAudioPlayerState';
import { useAudioPlayerTime } from '@/hooks/useAudioPlayerTime';
import { useKeyboardControls } from '@/hooks/useKeyboardControls';

interface AudioPlayerProps {
  audioUrl?: string;
  currentTime?: number;
  duration?: number;
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (time: number) => void;
  onSkipBack?: () => void;
  onSkipForward?: () => void;
  onSetLoop?: (start: number, end: number) => void;
  onClearLoop?: () => void;
  loopStart?: number;
  loopEnd?: number;
  title?: string;
  onSetAbLoop?: (start: number, end: number) => void;
  onClearAbLoop?: () => void;
  abLoopStart?: number;
  abLoopEnd?: number;
}

const AudioPlayer = React.memo<AudioPlayerProps>(
  ({
    audioUrl,
    currentTime = 0,
    duration = 0,
    isPlaying = false,
    onPlay,
    onPause,
    onSeek,
    onSkipBack,
    onSkipForward,
    onSetLoop,
    onClearLoop,
    loopStart,
    loopEnd,
    title = 'Audio Player',
    onSetAbLoop,
    onClearAbLoop,
    abLoopStart,
    abLoopEnd,
  }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const { formatTime, parseTimeInput } = useAudioPlayerTime();
    const {
      isMuted,
      volume,
      playbackRate,
      showAdvancedControls,
      setVolume,
      setPlaybackRate,
      toggleMute,
      setShowAdvancedControls,
    } = useAudioPlayerState();

    const {
      abLoopMode,
      customLoopStart,
      customLoopEnd,
      handleAbLoopSet,
      handleAbLoopClear,
      handleCustomLoopApply,
      setCustomLoopStart,
      setCustomLoopEnd,
      getAbLoopStatus,
    } = useAbLoop({
      currentTime,
      duration,
      formatTime,
      parseTimeInput,
      onSetAbLoop,
      onClearAbLoop,
    });

    const handlePlayPause = () => {
      if (isPlaying) {
        onPause?.();
      } else {
        onPlay?.();
      }
    };

    const handleProgressChange = (value: number[]) => {
      if (!duration) return;
      const seekTime = (value[0] / 100) * duration;
      onSeek?.(seekTime);
    };

    const handleVolumeChange = (value: number[]) => {
      const newVolume = value[0];
      setVolume([newVolume]);
    };

    const handlePlaybackRateChange = (value: number[]) => {
      const newRate = value[0];
      setPlaybackRate([newRate]);
    };

    const handleLoopToggle = () => {
      if (loopStart === undefined) {
        onSetLoop?.(currentTime, currentTime + 10);
      } else {
        onClearLoop?.();
      }
    };

    // Keyboard controls
    useKeyboardControls({
      audioUrl,
      onPlayPause: handlePlayPause,
      onSkipBack,
      onSkipForward,
      onSetAbLoop: handleAbLoopSet,
      onToggleMute: toggleMute,
      onSetPlaybackRate: (rate) => setPlaybackRate([rate]),
    });

    // Memoized values
    const progressValue = useMemo(
      () => (duration ? [(currentTime / duration) * 100] : [0]),
      [currentTime, duration]
    );

    const formattedCurrentTime = useMemo(() => formatTime(currentTime), [currentTime, formatTime]);

    const formattedDuration = useMemo(() => formatTime(duration), [duration, formatTime]);

    const formattedLoopTime = useMemo(() => {
      if (loopStart === undefined) return null;
      return `${formatTime(loopStart)}-${formatTime(loopEnd || loopStart + 10)}`;
    }, [loopStart, loopEnd, formatTime]);

    const formattedAbLoopTime = useMemo(() => {
      if (abLoopStart === undefined || abLoopEnd === undefined) return null;
      return `${formatTime(abLoopStart)}-${formatTime(abLoopEnd)}`;
    }, [abLoopStart, abLoopEnd, formatTime]);

    // Audio element effects
    useEffect(() => {
      if (audioRef.current) {
        audioRef.current.volume = volume[0];
        audioRef.current.playbackRate = playbackRate[0];
      }
    }, [volume, playbackRate]);

    const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
      const audio = e.target as HTMLAudioElement;
      onSeek?.(audio.currentTime);
    };

    return (
      <Card className="space-y-4 p-6">
        {/* Title */}
        <h3 className="truncate font-medium text-lg">{title}</h3>

        {/* Waveform Display */}
        {audioUrl && (
          <WaveformDisplay
            audioUrl={audioUrl}
            currentTime={currentTime}
            duration={duration}
            onSeek={onSeek}
            height={60}
            showProgress={true}
            color="#3b82f6"
            progressColor="#10b981"
          />
        )}

        {/* Progress bar */}
        <div className="space-y-2">
          <Slider
            value={progressValue}
            max={100}
            step={0.1}
            onValueChange={handleProgressChange}
            className="w-full"
          />
          <div className="flex justify-between text-muted-foreground text-sm">
            <span>{formattedCurrentTime}</span>
            <span>{formattedDuration}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col space-y-4">
          {/* Main controls row */}
          <div className="flex items-center justify-between">
            <AudioControls
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onSkipBack={onSkipBack}
              onSkipForward={onSkipForward}
              audioUrl={audioUrl}
            />

            <VolumeControl
              isMuted={isMuted}
              volume={volume}
              onToggleMute={toggleMute}
              onVolumeChange={handleVolumeChange}
            />
          </div>

          {/* Advanced controls row */}
          <div className="flex items-center justify-between">
            <LoopControls
              loopStart={loopStart}
              loopEnd={loopEnd}
              abLoopStart={abLoopStart}
              abLoopEnd={abLoopEnd}
              formattedLoopTime={formattedLoopTime}
              formattedAbLoopTime={formattedAbLoopTime}
              getAbLoopStatus={getAbLoopStatus}
              onSetLoop={handleLoopToggle}
              onClearLoop={onClearLoop}
              onSetAbLoop={handleAbLoopSet}
              onClearAbLoop={handleAbLoopClear}
            />

            <PlaybackSpeedControl
              playbackRate={playbackRate}
              onPlaybackRateChange={handlePlaybackRateChange}
            />
          </div>

          {/* A-B Loop custom input */}
          {(abLoopMode !== 'idle' || showAdvancedControls) && (
            <AbLoopInput
              customLoopStart={customLoopStart}
              customLoopEnd={customLoopEnd}
              onCustomLoopStartChange={setCustomLoopStart}
              onCustomLoopEndChange={setCustomLoopEnd}
              onCustomLoopApply={handleCustomLoopApply}
            />
          )}
        </div>

        {/* Keyboard shortcuts help */}
        <KeyboardShortcutsHelp
          showAdvancedControls={showAdvancedControls}
          onToggleAdvancedControls={() => setShowAdvancedControls(!showAdvancedControls)}
        />

        {/* Hidden audio element */}
        {audioUrl && (
          <audio ref={audioRef} src={audioUrl} onTimeUpdate={handleTimeUpdate} onEnded={onPause}>
            <track kind="captions" src="" srcLang="en" label="English" />
          </audio>
        )}
      </Card>
    );
  }
);

AudioPlayer.displayName = 'AudioPlayer';

export default AudioPlayer;
