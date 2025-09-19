import { Volume2, VolumeX } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VolumeControlProps {
  isMuted: boolean;
  volume: number[];
  onToggleMute: () => void;
  onVolumeChange: (value: number[]) => void;
}

const VolumeControl = React.memo<VolumeControlProps>(
  ({ isMuted, volume, onToggleMute, onVolumeChange }) => {
    return (
      <div className="flex items-center space-x-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onToggleMute} className="h-8 w-8">
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isMuted ? '取消静音 (M)' : '静音 (M)'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Slider value={volume} max={1} step={0.1} onValueChange={onVolumeChange} className="w-20" />
      </div>
    );
  }
);

VolumeControl.displayName = 'VolumeControl';

export default VolumeControl;
