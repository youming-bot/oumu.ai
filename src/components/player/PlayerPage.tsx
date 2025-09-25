"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import ScrollableSubtitleDisplay from "@/components/player/ScrollableSubtitleDisplay";
import SeekBar from "@/components/player/SeekBar";
import { formatDuration, formatFileSize, usePlayerData } from "@/hooks/player/usePlayerData";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { cn } from "@/lib/utils";
import type { Segment } from "@/types/database";

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function PlayerPageComponent({ fileId }: { fileId: string }) {
  const router = useRouter();
  const { file, segments, transcript, audioUrl, loading, error, retry } = usePlayerData(fileId);

  const {
    audioPlayerState,
    handleSeek,
    onPlay,
    onPause,
    clearAudio,
    setCurrentFile,
    updatePlayerState,
    playbackRate,
    setPlaybackRate,
    onSkipBack,
    onSkipForward,
    onClearLoop,
    loopStart,
    loopEnd,
  } = useAudioPlayer();

  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(-1);
  const { theme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  const subtitleContainerId = useId();

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  const sanitizeNumber = useCallback((value: number, fallback: number = 0): number => {
    if (!Number.isFinite(value) || Number.isNaN(value)) {
      return fallback;
    }
    return value;
  }, []);

  useEffect(() => {
    if (file && audioUrl) {
      setCurrentFile(file);
    }
  }, [file, audioUrl, setCurrentFile]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    audio.pause();
    audio.currentTime = 0;
    audio.load();

    const fallbackDuration = file?.duration ?? 0;
    updatePlayerState({
      isPlaying: false,
      currentTime: 0,
      duration: sanitizeNumber(fallbackDuration, 0),
    });
  }, [audioUrl, file?.duration, updatePlayerState, sanitizeNumber]);

  useEffect(() => {
    if (!audioRef.current) return;

    if (audioPlayerState.isPlaying) {
      audioRef.current.play().catch((_error) => {
        updatePlayerState({ isPlaying: false });
      });
    } else {
      audioRef.current.pause();
    }
  }, [audioPlayerState.isPlaying, updatePlayerState]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    if (!audioRef.current) return;

    const currentTime = audioRef.current.currentTime;
    const diff = Math.abs(currentTime - audioPlayerState.currentTime);

    if (diff > 0.1) {
      audioRef.current.currentTime = audioPlayerState.currentTime;
    }
  }, [audioPlayerState.currentTime]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const current = sanitizeNumber(audio.currentTime, 0);
      updatePlayerState({ currentTime: current });
    };

    const handleLoadedMetadata = () => {
      const fallbackDuration = file?.duration ?? 0;
      const duration = sanitizeNumber(audio.duration, fallbackDuration);
      updatePlayerState({ duration });
    };

    const handleDurationChange = () => {
      const fallbackDuration = file?.duration ?? 0;
      const duration = sanitizeNumber(audio.duration, fallbackDuration);
      updatePlayerState({ duration });
    };

    const handleEnded = () => {
      const duration = sanitizeNumber(audio.duration, audioPlayerState.duration);
      updatePlayerState({ isPlaying: false, currentTime: duration });
      onClearLoop();
    };

    const handlePlay = () => {
      updatePlayerState({ isPlaying: true });
    };

    const handlePause = () => {
      updatePlayerState({ isPlaying: false });
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [updatePlayerState, sanitizeNumber, file?.duration, audioPlayerState.duration, onClearLoop]);

  useEffect(() => {
    if (!segments.length || !audioPlayerState.isPlaying) return;

    const currentIndex = segments.findIndex(
      (segment) =>
        audioPlayerState.currentTime >= segment.start &&
        audioPlayerState.currentTime <= segment.end,
    );

    if (currentIndex !== currentSegmentIndex) {
      setCurrentSegmentIndex(currentIndex);
    }
  }, [audioPlayerState.currentTime, segments, audioPlayerState.isPlaying, currentSegmentIndex]);

  const handleSegmentClick = (segment: Segment) => {
    handleSeek(segment.start);
    if (!audioPlayerState.isPlaying) {
      onPlay();
    }
  };

  const handleBack = useCallback(() => {
    clearAudio();
    router.push("/");
  }, [clearAudio, router]);

  const handleThemeToggle = useCallback(() => {
    if (!themeMounted) return;
    setTheme(theme === "dark" ? "light" : "dark");
  }, [themeMounted, theme, setTheme]);

  const handleTogglePlay = useCallback(() => {
    if (audioPlayerState.isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  }, [audioPlayerState.isPlaying, onPause, onPlay]);

  const currentSegmentLabel = useMemo(() => {
    if (currentSegmentIndex < 0 || !segments[currentSegmentIndex]) return null;
    const segment = segments[currentSegmentIndex];
    return `${formatTime(segment.start)} – ${formatTime(segment.end)}`;

    function formatTime(value: number) {
      const minutes = Math.floor(value / 60);
      const seconds = Math.floor(value % 60);
      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
  }, [currentSegmentIndex, segments]);

  const renderPageShell = (
    body: ReactNode,
    options: { showFooter?: boolean } = {},
  ) => {
    const showFooter = options.showFooter ?? Boolean(audioUrl);
    const navItems = [
      { id: "home", icon: "folder", label: "文件", onClick: handleBack },
      { id: "settings", icon: "settings", label: "设置", disabled: true },
      { id: "profile", icon: "account_circle", label: "个人", disabled: true },
      {
        id: "theme",
        icon: theme === "dark" ? "light_mode" : "dark_mode",
        label: "主题",
        onClick: handleThemeToggle,
      },
    ];

    return (
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden">
        <header className="fixed top-4 left-1/2 z-20 -translate-x-1/2">
          <nav className="nav-container">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                disabled={item.disabled}
                className={cn(
                  "nav-button",
                  item.id === "home" && "active",
                  item.disabled && "cursor-default opacity-50",
                )}
                aria-label={item.label}
              >
                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
              </button>
            ))}
          </nav>
        </header>
        <main
          id={subtitleContainerId}
          className="flex-1 overflow-y-auto px-4 pt-28 pb-64 sm:px-10 md:px-20 lg:px-40"
        >
          <div className="mx-auto max-w-4xl space-y-6">
            {file && (
              <section className="player-card flex flex-col gap-3">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-[var(--text-color)]/70">
                      NOW SHADOWING
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold leading-tight text-[var(--text-color)]">
                      {file.name}
                    </h1>
                  </div>
                  <div className="text-sm text-[var(--secondary-text-color)] dark:text-[var(--text-color)]/70">
                    <p>{formatFileSize(file.size)}</p>
                    <p className="mt-1 text-xs">时长 {formatDuration(audioPlayerState.duration || 0)}</p>
                    {currentSegmentLabel && (
                      <span className="mt-3 inline-flex w-fit items-center rounded-full bg-[var(--player-highlight-bg)] px-3 py-1 text-xs font-medium text-[var(--player-accent-color)]">
                        {currentSegmentLabel}
                      </span>
                    )}
                  </div>
                </div>
              </section>
            )}

            {body}
          </div>
        </main>

        {showFooter && audioUrl ? (
          <footer className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-[var(--background-color)] via-[var(--background-color)] to-transparent">
            <div className="mx-auto max-w-4xl pb-6 pt-12">
              <div className="player-control-surface">
                <SeekBar
                  currentTime={audioPlayerState.currentTime}
                  duration={audioPlayerState.duration || 0}
                  onSeek={handleSeek}
                  className="space-y-3"
                />

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center justify-start gap-3 md:w-1/3">
                    <button
                      type="button"
                      onClick={onSkipBack}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-[var(--text-color)] shadow-md transition-transform hover:-translate-y-0.5 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--player-accent-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-color)] dark:bg-white/10 dark:hover:bg-white/20"
                      aria-label="后退10秒"
                    >
                      <span className="material-symbols-outlined text-2xl">replay_10</span>
                    </button>
                    <button
                      type="button"
                      onClick={onSkipForward}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-[var(--text-color)] shadow-md transition-transform hover:-translate-y-0.5 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--player-accent-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-color)] dark:bg-white/10 dark:hover:bg-white/20"
                      aria-label="前进10秒"
                    >
                      <span className="material-symbols-outlined text-2xl">forward_10</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-4 md:w-1/3">
                    <button
                      type="button"
                      onClick={handleTogglePlay}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--player-accent-color)] text-[var(--player-tooltip-text)] shadow-xl transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--player-accent-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-color)]"
                      aria-label={audioPlayerState.isPlaying ? "暂停" : "播放"}
                    >
                      <span className="material-symbols-outlined text-4xl">
                        {audioPlayerState.isPlaying ? "pause" : "play_arrow"}
                      </span>
                    </button>
                    {loopStart !== undefined && loopEnd !== undefined && (
                      <button
                        type="button"
                        onClick={onClearLoop}
                        className="rounded-full border border-white/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-color)]/80 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--player-accent-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-color)] dark:border-white/10 dark:text-[var(--text-color)]"
                      >
                        清除循环
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 md:w-1/3 md:items-end">
                    <label className="flex flex-col gap-2 text-right">
                      <div className="relative inline-flex items-center">
                        <select
                          value={playbackRate.toString()}
                          onChange={(event) => setPlaybackRate(parseFloat(event.target.value))}
                          className="appearance-none rounded-full border border-[var(--settings-border-color)] bg-transparent px-5 py-2 pr-10 text-sm font-semibold text-[var(--text-color)] shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--player-accent-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-color)]"
                        >
                          {PLAYBACK_SPEEDS.map((speed) => (
                            <option key={speed} value={speed.toString()}>
                              {speed}x
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-3 text-[var(--text-color)]/70">
                          ▾
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        ) : null}

        <audio ref={audioRef} src={audioUrl ?? undefined} preload="auto" className="hidden" />
      </div>
    );
  };

  if (loading) {
    return renderPageShell(
      <div className="player-card flex min-h-[40vh] flex-col items-center justify-center gap-4 text-sm text-[var(--secondary-text-color)] dark:text-[var(--text-color)]/70">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--player-accent-color)]" />
        <p>加载播放器中...</p>
      </div>,
      { showFooter: false },
    );
  }

  if (error) {
    return renderPageShell(
      <div className="player-card flex flex-col gap-4 text-sm">
        <div className="flex items-center gap-3 text-red-500">
          <AlertCircle className="h-5 w-5" />
          <h2 className="text-lg font-semibold">加载失败</h2>
        </div>
        <p className="text-[var(--secondary-text-color)] dark:text-[var(--text-color)]/70">{error}</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={retry}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-white/40 px-4 py-2 text-sm font-medium text-[var(--text-color)]/80 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--player-accent-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-color)] dark:border-white/10"
          >
            重试
          </button>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-[var(--player-accent-color)] px-4 py-2 text-sm font-semibold text-[var(--player-tooltip-text)] shadow hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--player-accent-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-color)]"
          >
            返回
          </button>
        </div>
      </div>,
      { showFooter: false },
    );
  }

  if (!file) {
    return renderPageShell(
      <div className="player-card flex flex-col gap-4 text-sm text-[var(--secondary-text-color)] dark:text-[var(--text-color)]/70">
        <div className="flex items-center gap-3 text-[var(--text-color)]">
          <AlertCircle className="h-5 w-5" />
          <h2 className="text-lg font-semibold">文件不存在</h2>
        </div>
        <p>找不到指定的音频文件</p>
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center justify-center rounded-full bg-[var(--player-accent-color)] px-4 py-2 text-sm font-semibold text-[var(--player-tooltip-text)] shadow hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--player-accent-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-color)]"
        >
          返回主页
        </button>
      </div>,
      { showFooter: false },
    );
  }

  return renderPageShell(
    <>
      {transcript && transcript.status !== "completed" && (
        <div
          className={cn(
            "player-card flex items-center gap-3 text-sm",
            transcript.status === "failed"
              ? "border-red-400/60 bg-red-500/15 text-red-400"
              : "border-[var(--player-accent-color)]/40 bg-[var(--player-highlight-bg)] text-[var(--player-accent-color)]",
          )}
        >
          {transcript.status === "failed" ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          <span>
            {transcript.status === "pending" && "等待转录..."}
            {transcript.status === "processing" && "正在转录..."}
            {transcript.status === "failed" && "转录失败"}
          </span>
        </div>
      )}

      {segments.length > 0 ? (
        <ScrollableSubtitleDisplay
          segments={segments}
          currentTime={audioPlayerState.currentTime}
          isPlaying={audioPlayerState.isPlaying}
          onSegmentClick={handleSegmentClick}
          className="player-card"
        />
      ) : (
        transcript?.status === "completed" && (
          <div className="player-card flex flex-col items-center gap-3 py-12 text-center text-sm text-[var(--secondary-text-color)] dark:text-[var(--text-color)]/70">
            <p>暂无字幕内容</p>
          </div>
        )
      )}

      {!transcript && (
        <div className="player-card flex flex-col items-center gap-4 py-12 text-center text-sm text-[var(--secondary-text-color)] dark:text-[var(--text-color)]/70">
          <p>该文件尚未转录，请在主页进行转录处理</p>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center justify-center rounded-full bg-[var(--player-accent-color)] px-4 py-2 text-sm font-semibold text-[var(--player-tooltip-text)] shadow hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--player-accent-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-color)]"
          >
            返回主页
          </button>
        </div>
      )}
    </>,
    { showFooter: Boolean(audioUrl) },
  );
}
