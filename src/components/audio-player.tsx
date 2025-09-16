'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import WaveformDisplay from '@/components/waveform-display';

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
}

export default function AudioPlayer({
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
  title = 'Audio Player'
}: AudioPlayerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState([1]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (value: number[]) => {
    if (!duration) return;
    const seekTime = (value[0] / 100) * duration;
    onSeek?.(seekTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume([newVolume]);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    setVolume(newMutedState ? [0] : [1]);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0];
    }
  }, [volume]);

  const progressValue = duration ? [(currentTime / duration) * 100] : [0];

  return (
    <Card className="p-6 space-y-4">
      {/* Title */}
      <h3 className="text-lg font-medium truncate">{title}</h3>

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
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Skip back */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onSkipBack}
                  disabled={!onSkipBack}
                  className="h-10 w-10"
                >
                  <SkipBack className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Skip back</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Play/Pause */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={isPlaying ? onPause : onPlay}
                  disabled={!audioUrl}
                  className="h-12 w-12"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isPlaying ? 'Pause' : 'Play'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Skip forward */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onSkipForward}
                  disabled={!onSkipForward}
                  className="h-10 w-10"
                >
                  <SkipForward className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Skip forward</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Loop controls */}
        {onSetLoop && onClearLoop && (
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={loopStart !== undefined ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => {
                      if (loopStart === undefined) {
                        onSetLoop(currentTime, currentTime + 10); // Set 10-second loop
                      } else {
                        onClearLoop();
                      }
                    }}
                    className="h-8 w-8"
                  >
                    {loopStart !== undefined ? (
                      <Square className="w-4 h-4" />
                    ) : (
                      <Repeat className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{loopStart !== undefined ? 'Clear loop' : 'Set loop'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {loopStart !== undefined && (
              <span className="text-xs text-muted-foreground">
                {formatTime(loopStart)}-{formatTime(loopEnd || loopStart + 10)}
              </span>
            )}
          </div>
        )}

        {/* Volume control */}
        <div className="flex items-center space-x-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="h-8 w-8"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isMuted ? 'Unmute' : 'Mute'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Slider
            value={volume}
            max={1}
            step={0.1}
            onValueChange={handleVolumeChange}
            className="w-20"
          />
        </div>
      </div>

      {/* Hidden audio element for actual playback */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={(e) => {
            const audio = e.target as HTMLAudioElement;
            onSeek?.(audio.currentTime);
          }}
          onEnded={onPause}
        />
      )}
    </Card>
  );
}