import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface KeyboardShortcutsHelpProps {
  showAdvancedControls: boolean;
  onToggleAdvancedControls: () => void;
}

const KeyboardShortcutsHelp = React.memo<KeyboardShortcutsHelpProps>(
  ({ showAdvancedControls, onToggleAdvancedControls }) => {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={onToggleAdvancedControls}>
              快捷键帮助
            </Button>
          </div>
          {showAdvancedControls && (
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
              <div className="space-y-1">
                <div className="font-medium">播放控制</div>
                <div className="text-muted-foreground">
                  <div>空格: 播放/暂停</div>
                  <div>←/→: 后退/前进</div>
                  <div>M: 静音/取消静音</div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">播放速度</div>
                <div className="text-muted-foreground">
                  <div>1: 0.25x</div>
                  <div>2: 0.5x</div>
                  <div>3: 0.75x</div>
                  <div>4: 1.0x</div>
                  <div>5: 1.25x</div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">A-B循环</div>
                <div className="text-muted-foreground">
                  <div>Ctrl+A: 设置A/B点</div>
                  <div>点击设置精确循环</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }
);

KeyboardShortcutsHelp.displayName = 'KeyboardShortcutsHelp';

export default KeyboardShortcutsHelp;
