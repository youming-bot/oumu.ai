import { Clock } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface AbLoopInputProps {
  customLoopStart: string;
  customLoopEnd: string;
  onCustomLoopStartChange: (value: string) => void;
  onCustomLoopEndChange: (value: string) => void;
  onCustomLoopApply: () => void;
}

const AbLoopInput = React.memo<AbLoopInputProps>(
  ({
    customLoopStart,
    customLoopEnd,
    onCustomLoopStartChange,
    onCustomLoopEndChange,
    onCustomLoopApply,
  }) => {
    return (
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">自定义A-B循环:</span>
          </div>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="开始时间 (mm:ss)"
              value={customLoopStart}
              onChange={(e) => onCustomLoopStartChange(e.target.value)}
              className="w-24"
            />
            <span className="text-muted-foreground">至</span>
            <Input
              placeholder="结束时间 (mm:ss)"
              value={customLoopEnd}
              onChange={(e) => onCustomLoopEndChange(e.target.value)}
              className="w-24"
            />
            <Button
              size="sm"
              onClick={onCustomLoopApply}
              disabled={!customLoopStart || !customLoopEnd}
            >
              应用
            </Button>
          </div>
        </div>
      </Card>
    );
  }
);

AbLoopInput.displayName = 'AbLoopInput';

export default AbLoopInput;
