import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AudioControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onSkipBack?: () => void;
  onSkipForward?: () => void;
  audioUrl?: string;
}

const AudioControls = React.memo<AudioControlsProps>(
  ({ isPlaying, onPlayPause, onSkipBack, onSkipForward, audioUrl }) => {
    return (
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
                <SkipBack className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>后退 (←)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Play/Pause */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" onClick={onPlayPause} disabled={!audioUrl} className="h-12 w-12">
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isPlaying ? '暂停 (空格)' : '播放 (空格)'}</p>
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
                <SkipForward className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>前进 (→)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }
);

AudioControls.displayName = 'AudioControls';

export default AudioControls;
