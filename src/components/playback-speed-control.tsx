import { Gauge } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PlaybackSpeedControlProps {
  playbackRate: number[];
  onPlaybackRateChange: (value: number[]) => void;
}

const PlaybackSpeedControl = React.memo<PlaybackSpeedControlProps>(
  ({ playbackRate, onPlaybackRateChange }) => {
    return (
      <div className="flex items-center space-x-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Gauge className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>播放速度: {playbackRate[0]}x (1-5)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Slider
          value={playbackRate}
          min={0.25}
          max={2}
          step={0.25}
          onValueChange={onPlaybackRateChange}
          className="w-24"
        />
        <span className="w-8 text-muted-foreground text-xs">{playbackRate[0]}x</span>
      </div>
    );
  }
);

PlaybackSpeedControl.displayName = 'PlaybackSpeedControl';

export default PlaybackSpeedControl;
