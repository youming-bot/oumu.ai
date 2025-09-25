"use client";

import React, { useCallback, useEffect, useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  BookOpen,
  Clock,
  RotateCcw,
  Settings,
  SkipBack,
  SkipForward,
} from "lucide-react";
import type { Subtitle, SubtitleState } from "@/lib/subtitle-sync";
import { SubtitleSynchronizer } from "@/lib/subtitle-sync";
import { WordTimestampService } from "@/lib/word-timestamp-service";
import {
  processSegmentRuby,
  getHighlightedCharacters,
  containsJapanese,
  type RubyWord,
} from "@/lib/ruby-text-processor";
import type { Segment } from "@/types/database";

interface EnhancedSubtitleDisplayProps {
  segments: Segment[];
  currentTime: number;
  isPlaying: boolean;
  onSeek?: (time: number) => void;
  showTranslation?: boolean;
  showRomaji?: boolean;
  showFurigana?: boolean;
  className?: string;
}

const EnhancedSubtitleDisplay = React.memo<EnhancedSubtitleDisplayProps>(
  ({
    segments,
    currentTime,
    onSeek,
    showTranslation = true,
    showRomaji = true,
    showFurigana = true,
    className = "",
  }) => {
    const [subtitleState, setSubtitleState] = useState<SubtitleState>({
      currentSubtitle: null,
      upcomingSubtitles: [],
      previousSubtitles: [],
      allSubtitles: [],
    });

    const [synchronizer, setSynchronizer] =
      useState<SubtitleSynchronizer | null>(null);
    const [currentWord, setCurrentWord] = useState<{
      word: string;
      index: number;
    } | null>(null);
    const [rubyWords, setRubyWords] = useState<RubyWord[]>([]);
    const [highlightedChar, setHighlightedChar] = useState<{
      wordIndex: number;
      charIndex: number;
    } | null>(null);

    // 字幕显示设置
    const [showSettings, setShowSettings] = useState(false);
    const [fontSize, setFontSize] = useState([24]);
    const [lineHeight, setLineHeight] = useState([1.8]);
    const [rubyFontSize, setRubyFontSize] = useState([12]);

    const safeCurrentTime =
      Number.isFinite(currentTime) && !Number.isNaN(currentTime)
        ? currentTime
        : 0;

    // 生成唯一ID
    const fontSizeId = useId();
    const lineHeightId = useId();
    const rubyFontSizeId = useId();

    // 格式化时间
    const formatTime = useCallback((seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 100);

      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
    }, []);

    // 处理点击事件
    const handleWordClick = useCallback(
      (startTime: number, event: React.MouseEvent) => {
        event.stopPropagation();
        if (onSeek) {
          onSeek(startTime);
        }
      },
      [onSeek],
    );

    // 处理键盘事件
    const handleWordKeyDown = useCallback(
      (event: React.KeyboardEvent, startTime: number) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          if (onSeek) {
            onSeek(startTime);
          }
        }
      },
      [onSeek],
    );

    // 字幕导航功能
    const navigateToPreviousSubtitle = useCallback(() => {
      if (subtitleState.previousSubtitles.length > 0) {
        const previousSubtitle =
          subtitleState.previousSubtitles[
            subtitleState.previousSubtitles.length - 1
          ];
        onSeek?.(previousSubtitle.start);
      }
    }, [subtitleState.previousSubtitles, onSeek]);

    const navigateToNextSubtitle = useCallback(() => {
      if (subtitleState.upcomingSubtitles.length > 0) {
        const nextSubtitle = subtitleState.upcomingSubtitles[0];
        onSeek?.(nextSubtitle.start);
      }
    }, [subtitleState.upcomingSubtitles, onSeek]);

    const navigateToCurrentSubtitle = useCallback(() => {
      if (subtitleState.currentSubtitle) {
        onSeek?.(subtitleState.currentSubtitle.start);
      }
    }, [subtitleState.currentSubtitle, onSeek]);

    // 初始化字幕同步器
    useEffect(() => {
      if (segments.length > 0) {
        const sync = new SubtitleSynchronizer(segments, {
          preloadTime: 2.0,
          postloadTime: 1.0,
          syncThreshold: 0.05,
          maxSubtitles: 3,
        });

        sync.onUpdate(setSubtitleState);
        setSynchronizer(sync);

        return () => {
          sync.destroy();
        };
      }
    }, [segments]);

    // 更新时间
    useEffect(() => {
      if (synchronizer) {
        synchronizer.updateTime(safeCurrentTime);
      }
    }, [safeCurrentTime, synchronizer]);

    // 更新当前单词和字符高亮
    useEffect(() => {
      if (subtitleState.currentSubtitle?.wordTimestamps) {
        const currentWord = WordTimestampService.getCurrentWord(
          safeCurrentTime,
          subtitleState.currentSubtitle.wordTimestamps,
        );
        setCurrentWord(currentWord);

        // 处理ruby信息
        if (subtitleState.currentSubtitle) {
          const rubyWords = processSegmentRuby({
            ...subtitleState.currentSubtitle,
            transcriptId: 1, // 添加必需的字段
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          setRubyWords(rubyWords);
        }

        // 更新字符高亮
        const highlighted = getHighlightedCharacters(
          rubyWords,
          safeCurrentTime,
        );
        setHighlightedChar(highlighted);
      } else {
        setCurrentWord(null);
        setRubyWords([]);
        setHighlightedChar(null);
      }
    }, [safeCurrentTime, subtitleState.currentSubtitle]);

    // 渲染带有假名标记的文本
    const renderRubyText = useCallback(
      (subtitle: Subtitle, isActive: boolean = false) => {
        // 使用ruby文本处理器
        const rubyWords = processSegmentRuby({
          ...subtitle,
          transcriptId: 1, // 添加必需的字段
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        const highlighted = getHighlightedCharacters(
          rubyWords,
          safeCurrentTime,
        );

        return (
          <div className="space-y-2">
            {/* 主文本行 - 带假名 */}
            <div className="flex flex-wrap gap-1 justify-center">
              {rubyWords.map((rubyWord, wordIndex) => {
                const isWordHighlighted = highlighted?.wordIndex === wordIndex;

                return (
                  <div
                    key={`word-${subtitle.start}-${wordIndex}`}
                    className="relative inline-block"
                  >
                    {/* 假名标注 */}
                    {showFurigana &&
                      rubyWord.characters.some((char) => char.furigana) && (
                        <div className="absolute -top-4 left-0 right-0 text-center leading-none">
                          {rubyWord.characters.map((char, charIndex) => (
                            <span
                              key={`furigana-${wordIndex}-${charIndex}`}
                              className={`inline-block text-xs ${
                                isWordHighlighted &&
                                charIndex === highlighted?.charIndex
                                  ? "text-blue-600 font-bold"
                                  : "text-gray-600"
                              }`}
                              style={{ fontSize: `${rubyFontSize[0]}px` }}
                            >
                              {char.furigana || "　"}
                            </span>
                          ))}
                        </div>
                      )}

                    {/* 主文字 */}
                    <button
                      type="button"
                      onClick={(e) =>
                        handleWordClick(rubyWord.startTime || subtitle.start, e)
                      }
                      onKeyDown={(e) =>
                        handleWordKeyDown(
                          e,
                          rubyWord.startTime || subtitle.start,
                        )
                      }
                      className={`
                      relative px-1 py-0.5 rounded transition-all duration-200
                      hover:scale-105 cursor-pointer select-none
                      ${
                        isActive && isWordHighlighted
                          ? "bg-blue-100 text-blue-900 font-bold scale-105"
                          : isActive
                            ? "text-gray-900 hover:text-blue-700"
                            : "text-gray-600 hover:text-gray-900"
                      }
                    `}
                      style={{
                        fontSize: isActive
                          ? `${fontSize[0]}px`
                          : `${fontSize[0] - 2}px`,
                        lineHeight: `${lineHeight[0]}`,
                      }}
                    >
                      {rubyWord.characters.map((char, charIndex) => (
                        <span
                          key={`char-${wordIndex}-${charIndex}`}
                          className={`
                          ${
                            isWordHighlighted &&
                            charIndex === highlighted?.charIndex
                              ? "bg-blue-200 text-blue-900"
                              : ""
                          }
                        `}
                        >
                          {char.character}
                        </span>
                      ))}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 罗马音标注行 */}
            {showRomaji && containsJapanese(subtitle.text) && (
              <div className="flex flex-wrap gap-1 justify-center mt-1">
                {rubyWords.map((rubyWord, wordIndex) => (
                  <span
                    key={`romaji-${subtitle.start}-${wordIndex}`}
                    className={`text-xs leading-tight ${
                      highlighted?.wordIndex === wordIndex
                        ? "text-blue-600 font-medium"
                        : "text-gray-500"
                    }`}
                    style={{ fontSize: `${rubyFontSize[0]}px` }}
                  >
                    {rubyWord.romaji || rubyWord.text}
                    {wordIndex < rubyWords.length - 1 && " "}
                  </span>
                ))}
              </div>
            )}

            {/* 翻译行 */}
            {showTranslation && subtitle.translation && (
              <div className="text-center text-sm text-gray-600 mt-2 font-medium">
                {subtitle.translation}
              </div>
            )}
          </div>
        );
      },
      [
        showFurigana,
        showRomaji,
        showTranslation,
        fontSize,
        lineHeight,
        rubyFontSize,
        handleWordClick,
        handleWordKeyDown,
        safeCurrentTime,
      ],
    );

    if (segments.length === 0) {
      return (
        <div
          className={`rounded-lg bg-muted/20 p-8 text-center ${className}`}
          role="status"
          aria-live="polite"
        >
          <div className="text-muted-foreground">
            <p className="mb-2 font-medium text-lg" aria-live="polite">
              没有可用的字幕
            </p>
            <p className="text-sm">上传音频文件并转录以在此处查看字幕。</p>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`space-y-4 rounded-lg bg-background p-6 shadow-lg ${className}`}
        role="region"
        aria-label="增强字幕显示和控制面板"
      >
        {/* 顶部控制栏 */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between rounded-lg border border-primary/20 bg-background/95 p-4 backdrop-blur-sm"
          role="toolbar"
          aria-label="字幕控制工具栏"
        >
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="text-foreground hover:bg-primary/20"
              aria-label={showSettings ? "隐藏字幕设置" : "显示字幕设置"}
              aria-expanded={showSettings}
              aria-controls="subtitle-settings-panel"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">字幕设置</span>
            </Button>
            <Badge
              variant="outline"
              className="border-primary/50 text-foreground text-xs"
            >
              <Clock className="mr-1 h-3 w-3" />
              {subtitleState.allSubtitles.length} 个字幕
            </Badge>
            {subtitleState.currentSubtitle && (
              <Badge
                variant="secondary"
                className="bg-primary/20 text-foreground text-xs"
              >
                {formatTime(subtitleState.currentSubtitle.start)}
              </Badge>
            )}
          </div>

          <div
            className="flex items-center space-x-1"
            role="group"
            aria-label="字幕导航控制"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateToPreviousSubtitle}
              disabled={!subtitleState.previousSubtitles.length}
              className="h-8 w-8 p-0 text-foreground hover:bg-primary/20 disabled:opacity-50"
              aria-label="上一个字幕"
              aria-disabled={!subtitleState.previousSubtitles.length}
            >
              <SkipBack className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">上一个字幕</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateToCurrentSubtitle}
              disabled={!subtitleState.currentSubtitle}
              className="h-8 w-8 p-0 text-foreground hover:bg-primary/20 disabled:opacity-50"
              aria-label="当前字幕"
              aria-disabled={!subtitleState.currentSubtitle}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">当前字幕</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateToNextSubtitle}
              disabled={!subtitleState.upcomingSubtitles.length}
              className="h-8 w-8 p-0 text-foreground hover:bg-primary/20 disabled:opacity-50"
              aria-label="下一个字幕"
              aria-disabled={!subtitleState.upcomingSubtitles.length}
            >
              <SkipForward className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">下一个字幕</span>
            </Button>
          </div>
        </div>

        {/* 当前字幕（大字显示） */}
        {subtitleState.currentSubtitle && (
          <div className="rounded-lg border-2 border-primary bg-primary/5 p-8 shadow-sm">
            <div className="text-center">
              {renderRubyText(subtitleState.currentSubtitle, true)}
            </div>
          </div>
        )}

        {/* 设置面板 */}
        {showSettings && (
          <Card
            id="subtitle-settings-panel"
            className="w-full max-w-md p-4"
            role="dialog"
            aria-label="字幕设置对话框"
            aria-modal="true"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center font-medium text-sm">
                  <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
                  字幕设置
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                  aria-label="关闭设置"
                >
                  <span aria-hidden="true">×</span>
                  <span className="sr-only">关闭设置</span>
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor={fontSizeId} className="font-medium text-sm">
                    字体大小
                  </label>
                  <Slider
                    id={fontSizeId}
                    value={fontSize}
                    min={16}
                    max={36}
                    step={1}
                    onValueChange={setFontSize}
                    className="w-full"
                  />
                  <span className="text-muted-foreground text-xs">
                    {fontSize[0]}px
                  </span>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor={rubyFontSizeId}
                    className="font-medium text-sm"
                  >
                    假名字体大小
                  </label>
                  <Slider
                    id={rubyFontSizeId}
                    value={rubyFontSize}
                    min={8}
                    max={16}
                    step={1}
                    onValueChange={setRubyFontSize}
                    className="w-full"
                  />
                  <span className="text-muted-foreground text-xs">
                    {rubyFontSize[0]}px
                  </span>
                </div>

                <div className="space-y-2">
                  <label htmlFor={lineHeightId} className="font-medium text-sm">
                    行高
                  </label>
                  <Slider
                    id={lineHeightId}
                    value={lineHeight}
                    min={1.2}
                    max={2.5}
                    step={0.1}
                    onValueChange={setLineHeight}
                    className="w-full"
                  />
                  <span className="text-muted-foreground text-xs">
                    {lineHeight[0]}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  },
);

EnhancedSubtitleDisplay.displayName = "EnhancedSubtitleDisplay";

export default EnhancedSubtitleDisplay;
