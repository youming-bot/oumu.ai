import { Repeat, Scissors, Square, X } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LoopControlsProps {
  loopStart?: number;
  _loopEnd?: number;
  abLoopStart?: number;
  _abLoopEnd?: number;
  formattedLoopTime?: string | null;
  formattedAbLoopTime?: string | null;
  getAbLoopStatus: string;
  onSetLoop?: () => void;
  onClearLoop?: () => void;
  onSetAbLoop?: () => void;
  onClearAbLoop?: () => void;
}

const LoopControls = React.memo<LoopControlsProps>(
  ({
    loopStart,
    _loopEnd,
    abLoopStart,
    _abLoopEnd,
    formattedLoopTime,
    formattedAbLoopTime,
    getAbLoopStatus,
    onSetLoop,
    onClearLoop,
    onSetAbLoop,
    onClearAbLoop,
  }) => {
    return (
      <div className="flex items-center space-x-4">
        {/* Standard loop controls */}
        {onSetLoop && onClearLoop && (
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={loopStart !== undefined ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={onSetLoop}
                    className="h-8 w-8"
                  >
                    {loopStart !== undefined ? (
                      <Square className="h-4 w-4" />
                    ) : (
                      <Repeat className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{loopStart !== undefined ? '清除循环' : '设置10秒循环'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {loopStart !== undefined && formattedLoopTime && (
              <span className="text-muted-foreground text-xs">{formattedLoopTime}</span>
            )}
          </div>
        )}

        {/* A-B Loop controls */}
        {onSetAbLoop && onClearAbLoop && (
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={abLoopStart !== undefined ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={onSetAbLoop}
                    className="h-8 w-8"
                  >
                    <Scissors className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getAbLoopStatus} (Ctrl+A)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {abLoopStart !== undefined && formattedAbLoopTime && (
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  A-B: {formattedAbLoopTime}
                </Badge>
                <Button variant="ghost" size="icon" onClick={onClearAbLoop} className="h-6 w-6">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

LoopControls.displayName = 'LoopControls';

export default LoopControls;
