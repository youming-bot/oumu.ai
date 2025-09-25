"use client";

import React, { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SeekBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  className?: string;
}

const SeekBar = React.memo<SeekBarProps>(({ currentTime, duration, onSeek, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // 格式化时间为 MM:SS 格式
  const formatTime = useCallback((time: number): string => {
    if (!Number.isFinite(time) || time < 0) return "00:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  // 计算进度百分比
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const safeCurrentTime = Number.isFinite(currentTime) ? Math.max(0, currentTime) : 0;
  const cappedCurrentTime =
    safeDuration > 0 ? Math.min(safeCurrentTime, safeDuration) : safeCurrentTime;
  const progress = safeDuration > 0 ? (cappedCurrentTime / safeDuration) * 100 : 0;
  const hoverPercent =
    hoverTime !== null && safeDuration > 0
      ? (Math.max(0, Math.min(hoverTime, safeDuration)) / safeDuration) * 100
      : 0;

  // 处理鼠标点击或拖动
  const handleSeek = useCallback(
    (clientX: number) => {
      if (!progressRef.current) return;

      const rect = progressRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const referenceDuration = safeDuration > 0 ? safeDuration : duration;
      const newTime = percent * (Number.isFinite(referenceDuration) ? referenceDuration : 0);

      onSeek(newTime);
    },
    [duration, onSeek, safeDuration],
  );

  // 处理点击
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      handleSeek(e.clientX);
    },
    [handleSeek],
  );

  // 处理鼠标移动（显示悬停时间）
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current) return;

      const rect = progressRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const referenceDuration = safeDuration > 0 ? safeDuration : duration;
      const hoverTimeValue = percent * (Number.isFinite(referenceDuration) ? referenceDuration : 0);

      setHoverTime(hoverTimeValue);
    },
    [duration, safeDuration],
  );

  // 处理拖动开始
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  // 处理拖动
  const _handleDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isDragging) {
        handleSeek(e.clientX);
        handleMouseMove(e);
      }
    },
    [isDragging, handleSeek, handleMouseMove],
  );

  // 处理拖动结束
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setHoverTime(null);
  }, []);

  // 处理鼠标离开
  const handleMouseLeave = useCallback(() => {
    if (!isDragging) {
      setHoverTime(null);
    }
  }, [isDragging]);

  // 添加全局事件监听器
  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setHoverTime(null);
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && progressRef.current) {
        handleSeek(e.clientX);
      }
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, handleSeek]);

  return (
    <div className={cn("space-y-2", className)}>
      {/* 时间显示 */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{formatTime(cappedCurrentTime)}</span>
        <span>{formatTime(safeDuration)}</span>
      </div>

      {/* 进度条 */}
      <div
        ref={progressRef}
        className="player-seek"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleMouseLeave}
        onMouseOver={handleMouseMove}
        role="slider"
        aria-label="播放进度"
        aria-valuemin={0}
        aria-valuemax={safeDuration}
        aria-valuenow={cappedCurrentTime}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            onSeek(Math.max(0, cappedCurrentTime - 5));
          } else if (e.key === "ArrowRight") {
            const target = cappedCurrentTime + 5;
            onSeek(safeDuration > 0 ? Math.min(safeDuration, target) : target);
          }
        }}
      >
        {/* 进度填充 */}
        <div
          className="player-seek-progress"
          style={{ width: `${Number.isFinite(progress) ? progress : 0}%` }}
        />

        {/* 当前时间指示器 */}
        <div
          className="player-seek-thumb"
          style={{ left: `${Number.isFinite(progress) ? progress : 0}%` }}
        />

        {/* 悬停时间指示器 */}
        {hoverTime !== null && (
          <>
            <div
              className="player-seek-hover"
              style={{ left: `${hoverPercent}%` }}
            />
            <div
              className="player-seek-tooltip"
              style={{ left: `${hoverPercent}%` }}
            >
              {formatTime(hoverTime)}
            </div>
          </>
        )}
      </div>
    </div>
  );
});

SeekBar.displayName = "SeekBar";

export default SeekBar;
