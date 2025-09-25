"use client";

import {
  ChevronRight,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AudioPlayer from "@/components/audio-player";
import SubtitleDisplay from "@/components/subtitle-display";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePlayerDrawer } from "@/hooks/usePlayerDrawer";
import { cn } from "@/lib/utils";
import type { AudioPlayerState, FileRow, Segment } from "@/types/database";

interface PlayerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFile?: FileRow | null;
  audioUrl?: string;
  segments: Segment[];
  audioPlayerState: AudioPlayerState;
  loopStart?: number;
  loopEnd?: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onSetLoop: (start: number, end: number) => void;
  onClearLoop: () => void;
  clearAudio: () => void;
}

interface TouchInfo {
  startX: number;
  startY: number;
  startTime: number;
}

export default function PlayerDrawer({
  isOpen,
  onClose,
  selectedFile,
  audioUrl,
  segments,
  audioPlayerState,
  loopStart,
  loopEnd,
  onPlay,
  onPause,
  onSeek,
  onSkipBack,
  onSkipForward,
  onSetLoop,
  onClearLoop,
  clearAudio,
}: PlayerDrawerProps) {
  const { state, actions } = usePlayerDrawer();
  const [isClosing, setIsClosing] = useState(false);
  const [touchInfo, setTouchInfo] = useState<TouchInfo | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0);

  const drawerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 缓存 Slider 的 value 数组，避免每次渲染都创建新数组
  const sliderValue = useMemo(() => [state.displayVolume], [state.displayVolume]);

  // 处理抽屉关闭
  const handleDrawerClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      clearAudio();
      onClose();
      setIsClosing(false);
    }, 300);
  }, [clearAudio, onClose]);

  // 键盘事件处理
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      // 全局键盘快捷键
      switch (e.key) {
        case "Escape":
          handleDrawerClose();
          break;
        case " ":
          e.preventDefault();
          audioPlayerState.isPlaying ? onPause() : onPlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          onSkipBack();
          break;
        case "ArrowRight":
          e.preventDefault();
          onSkipForward();
          break;
        case "ArrowUp":
          e.preventDefault();
          actions.setVolume(Math.min(1, state.volume + 0.1));
          break;
        case "ArrowDown":
          e.preventDefault();
          actions.setVolume(Math.max(0, state.volume - 0.1));
          break;
        default:
          actions.handleKeyDown(e);
          break;
      }
    },
    [
      isOpen,
      handleDrawerClose,
      audioPlayerState.isPlaying,
      onPlay,
      onPause,
      onSkipBack,
      onSkipForward,
      actions,
      state.volume,
    ],
  );

  // 触摸事件处理
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (state.isFullscreen) return;

      const touch = e.touches[0];
      setTouchInfo({
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
      });
    },
    [state.isFullscreen],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchInfo || state.isFullscreen) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchInfo.startX;
      const deltaY = touch.clientY - touchInfo.startY;
      const _deltaTime = Date.now() - touchInfo.startTime;

      // 只响应水平方向的滑动
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        e.preventDefault();
        const progress = Math.max(0, Math.min(1, deltaX / window.innerWidth));
        setSwipeProgress(progress);
      }
    },
    [touchInfo, state.isFullscreen],
  );

  const handleTouchEnd = useCallback(() => {
    if (!touchInfo) return;

    // 如果滑动距离超过阈值，关闭抽屉
    if (swipeProgress > 0.3) {
      handleDrawerClose();
    } else {
      // 重置滑动进度
      setSwipeProgress(0);
    }

    setTouchInfo(null);
  }, [touchInfo, swipeProgress, handleDrawerClose]);

  // 鼠标事件处理
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      actions.startResize(e.clientX);
    },
    [actions],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      actions.handleResize(e.clientX);
    },
    [actions],
  );

  const handleMouseUp = useCallback(() => {
    actions.endResize();
  }, [actions]);

  // 事件监听器
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    if (state.isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleKeyDown, state.isDragging, handleMouseMove, handleMouseUp]);

  // 自动隐藏控制条
  useEffect(() => {
    if (!isOpen) return;
    actions.showControlsBar();
  }, [isOpen, actions]);

  // 计算抽屉样式
  const getDrawerStyle = useCallback(() => {
    const transform =
      isClosing || swipeProgress > 0
        ? `translateX(${(isClosing ? 1 : swipeProgress) * 100}%)`
        : "translateX(0)";

    if (state.isFullscreen) {
      return {
        width: "100vw",
        maxWidth: "100vw",
        transform,
        transition: isClosing
          ? "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      };
    }

    return {
      width: `${state.drawerSize.width * 100}vw`,
      maxWidth: `${state.drawerSize.maxWidth * 100}vw`,
      transform,
      transition: isClosing
        ? "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    };
  }, [
    state.isFullscreen,
    state.drawerSize.width,
    state.drawerSize.maxWidth,
    isClosing,
    swipeProgress,
  ]);

  // 阻止内容区域点击事件冒泡
  const handleContentClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      actions.showControlsBar();
    },
    [actions],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* 背景遮罩 */}
      <div
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300",
          isClosing ? "opacity-0" : "opacity-100",
        )}
        onClick={handleDrawerClose}
      />

      {/* 抽屉容器 */}
      <div
        ref={drawerRef}
        className="absolute inset-y-0 right-0 flex max-w-full"
        style={getDrawerStyle()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 抽屉内容 */}
        <div
          ref={contentRef}
          className={cn(
            "relative h-full bg-background shadow-2xl transition-all duration-300 ease-in-out dark:bg-[#0f1a19]",
            "border-border/50 border-l",
            "overflow-hidden",
          )}
          onClick={handleContentClick}
        >
          {/* 顶部控制栏 */}
          <div
            className={cn(
              "absolute top-0 right-0 left-0 z-20 border-border/50 border-b bg-background/90 backdrop-blur-md",
              "transition-all duration-300 ease-in-out",
              state.showControls ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0",
            )}
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDrawerClose}
                  className="h-8 w-8"
                  aria-label="关闭抽屉"
                >
                  <X className="h-4 w-4" />
                </Button>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={actions.toggleFullscreen}
                    className="h-8 w-8"
                    aria-label={state.isFullscreen ? "退出全屏" : "全屏"}
                  >
                    {state.isFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={actions.toggleMute}
                    className="h-8 w-8"
                    aria-label={state.isMuted ? "取消静音" : "静音"}
                  >
                    {state.isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>

                  <div className="flex w-24 items-center space-x-2">
                    <Slider
                      value={sliderValue}
                      onValueChange={(value) => actions.setVolume(value[0])}
                      max={1}
                      min={0}
                      step={0.1}
                      className="w-20"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground text-sm">
                  快捷键: H-控制栏 M-静音 F-全屏
                </span>
              </div>
            </div>
          </div>

          {/* 调整大小的手柄 */}
          {!state.isFullscreen && (
            <div
              className="absolute top-0 bottom-0 left-0 w-2 cursor-ew-resize transition-colors hover:bg-primary/20"
              onMouseDown={handleMouseDown}
              aria-label="调整抽屉大小"
            >
              <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-8 w-1 rounded-full bg-border" />
            </div>
          )}

          {/* 滑动指示器 */}
          {swipeProgress > 0 && (
            <div className="-translate-y-1/2 absolute top-1/2 left-4 z-30">
              <ChevronRight className="h-8 w-8 text-primary" />
            </div>
          )}

          {/* 主要内容区域 */}
          <div className="flex h-full flex-col overflow-hidden pt-16">
            {/* 文件信息头部 */}
            <div className="border-border/50 border-b bg-background/50 px-6 py-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold text-lg">
                    {selectedFile?.name || "音频播放器"}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {selectedFile && `${Math.round(selectedFile.size / 1024)} KB`}
                  </p>
                </div>

                {/* 快捷控制按钮 */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onSkipBack}
                    className="h-8 w-8"
                    aria-label="后退"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={audioPlayerState.isPlaying ? onPause : onPlay}
                    className="h-8 w-8"
                    aria-label={audioPlayerState.isPlaying ? "暂停" : "播放"}
                  >
                    {audioPlayerState.isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onSkipForward}
                    className="h-8 w-8"
                    aria-label="前进"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClearLoop}
                    className="h-8 w-8"
                    aria-label="清除循环"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* 内容滚动区域 */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-6 p-6">
                {/* 字幕显示 */}
                {segments.length > 0 && (
                  <div className="rounded-lg border bg-card/50 p-6 shadow-lg backdrop-blur-sm">
                    <h3 className="mb-4 flex items-center font-semibold text-lg">
                      <span className="mr-2">📝</span>
                      字幕
                    </h3>
                    <div className="max-h-96 overflow-y-auto">
                      <SubtitleDisplay
                        segments={segments}
                        currentTime={audioPlayerState.currentTime}
                        isPlaying={audioPlayerState.isPlaying}
                        onSeek={onSeek}
                        showTranslation={true}
                      />
                    </div>
                  </div>
                )}

                {/* 音频播放器 */}
                {audioUrl && (
                  <div className="rounded-lg border bg-card/50 p-6 shadow-lg backdrop-blur-sm">
                    <h3 className="mb-4 flex items-center font-semibold text-lg">
                      <span className="mr-2">🎵</span>
                      播放器
                    </h3>
                    <AudioPlayer
                      audioUrl={audioUrl}
                      currentTime={audioPlayerState.currentTime}
                      duration={audioPlayerState.duration}
                      isPlaying={audioPlayerState.isPlaying}
                      onPlay={onPlay}
                      onPause={onPause}
                      onSeek={onSeek}
                      onSkipBack={onSkipBack}
                      onSkipForward={onSkipForward}
                      title={selectedFile?.name || "音频播放器"}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
