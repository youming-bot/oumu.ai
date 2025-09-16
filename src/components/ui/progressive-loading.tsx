'use client';

import { useState, useEffect } from 'react';

interface ProgressiveLoadingProps {
  isLoading: boolean;
  estimatedTime?: number; // in seconds
  message?: string;
  className?: string;
}

export default function ProgressiveLoading({
  isLoading,
  estimatedTime,
  message = 'Processing...',
  className = ''
}: ProgressiveLoadingProps) {
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      setElapsedTime(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const currentElapsed = (Date.now() - startTime) / 1000;
      setElapsedTime(currentElapsed);

      if (estimatedTime && estimatedTime > 0) {
        // Calculate progress based on estimated time
        const calculatedProgress = Math.min(95, (currentElapsed / estimatedTime) * 100);
        setProgress(calculatedProgress);
      } else {
        // Indeterminate progress that slowly increases
        setProgress(prev => Math.min(85, prev + 0.5));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isLoading, estimatedTime]);

  if (!isLoading) return null;

  const remainingTime = estimatedTime ? Math.max(0, estimatedTime - elapsedTime) : undefined;

  return (
    <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}>
      <div className="bg-card border rounded-lg p-6 shadow-lg max-w-sm w-full mx-4">
        <div className="text-center space-y-4">
          {/* Animated spinner */}
          <div className="relative mx-auto w-12 h-12">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div 
              className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"
              style={{
                animationDuration: '1s',
                animationTimingFunction: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)'
              }}
            ></div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Message and timing */}
          <div className="space-y-1">
            <p className="font-medium text-sm">{message}</p>
            
            {estimatedTime && remainingTime !== undefined && (
              <p className="text-xs text-muted-foreground">
                Estimated time remaining: {Math.ceil(remainingTime)}s
              </p>
            )}
            
            {!estimatedTime && (
              <p className="text-xs text-muted-foreground">
                This may take a few moments...
              </p>
            )}
          </div>

          {/* Pulsing dots for additional visual feedback */}
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 bg-primary/60 rounded-full animate-pulse"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1.5s'
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}