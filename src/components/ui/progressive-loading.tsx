"use client";

import { useEffect, useState } from "react";

interface ProgressiveLoadingProps {
  isLoading: boolean;
  estimatedTime?: number; // in seconds
  message?: string;
  className?: string;
}

export default function ProgressiveLoading({
  isLoading,
  estimatedTime,
  message = "Processing...",
  className = "",
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
        setProgress((prev) => Math.min(85, prev + 0.5));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isLoading, estimatedTime]);

  if (!isLoading) return null;

  const remainingTime = estimatedTime ? Math.max(0, estimatedTime - elapsedTime) : undefined;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm ${className}`}
    >
      <div className="mx-4 w-full max-w-sm rounded-lg border bg-card p-6 shadow-lg">
        <div className="space-y-4 text-center">
          {/* Animated spinner */}
          <div className="relative mx-auto h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div
              className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent"
              style={{
                animationDuration: "1s",
                animationTimingFunction: "cubic-bezier(0.68, -0.55, 0.27, 1.55)",
              }}
            ></div>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-secondary">
            <div
              className="h-2 rounded-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Message and timing */}
          <div className="space-y-1">
            <p className="font-medium text-sm">{message}</p>

            {estimatedTime && remainingTime !== undefined && (
              <p className="text-muted-foreground text-xs">
                Estimated time remaining: {Math.ceil(remainingTime)}s
              </p>
            )}

            {!estimatedTime && (
              <p className="text-muted-foreground text-xs">This may take a few moments...</p>
            )}
          </div>

          {/* Pulsing dots for additional visual feedback */}
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={`dot-${i}`}
                className="h-2 w-2 animate-pulse rounded-full bg-primary/60"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: "1.5s",
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
