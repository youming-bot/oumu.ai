'use client';
import { RotateCcw, Settings, SkipBack, SkipForward } from 'lucide-react';
import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { DbUtils } from '@/lib/db';
import { type Subtitle, type SubtitleState, SubtitleSynchronizer } from '@/lib/subtitle-sync';
import { WordTimestampService } from '@/lib/word-timestamp-service';
import type { Segment } from '@/types/database';
import { SubtitleRenderer } from './subtitle-renderer';

interface SubtitleDisplayProps {
  segments: Segment[];
  currentTime: number;
  isPlaying: boolean;
  onSeek?: (time: number) => void;
  showTranslation?: boolean;
  className?: string;
}

const SubtitleDisplay = React.memo<SubtitleDisplayProps>(
  ({ segments, currentTime, onSeek, showTranslation = true, className = '' }) => {
    const [subtitleState, setSubtitleState] = useState<SubtitleState>({
      currentSubtitle: null,
      upcomingSubtitles: [],
      previousSubtitles: [],
      allSubtitles: [],
    });

    const [synchronizer, setSynchronizer] = useState<SubtitleSynchronizer | null>(null);
    const [terminology, setTerminology] = useState<Map<string, string>>(new Map());

    // Generate unique IDs for form controls
    const fontSizeId = useId();
    const lineHeightId = useId();
    const maxSubtitlesId = useId();
    const [currentWord, setCurrentWord] = useState<{
      word: string;
      index: number;
    } | null>(null);

    // 字幕显示设置
    const [showSettings, setShowSettings] = useState(false);
    const [fontSize, setFontSize] = useState([16]);
    const [lineHeight, setLineHeight] = useState([1.5]);
    const [showPrevious, setShowPrevious] = useState(true);
    const [showUpcoming, setShowUpcoming] = useState(true);
    const [highlightCurrent, setHighlightCurrent] = useState(true);
    const [_autoScroll, _setAutoScroll] = useState(true);
    const [maxSubtitles, setMaxSubtitles] = useState([3]);

    // Memoize format time function
    const formatTime = useCallback((seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 100);

      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }, []);

    // Memoize click handlers
    const handleSubtitleClick = useCallback(
      (subtitle: Subtitle) => {
        if (onSeek) {
          onSeek(subtitle.start);
        }
      },
      [onSeek]
    );

    const handleSubtitleKeyDown = useCallback(
      (event: React.KeyboardEvent, subtitle: Subtitle) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (onSeek) {
            onSeek(subtitle.start);
          }
        }
      },
      [onSeek]
    );

    const _handleWordClick = useCallback(
      (event: React.MouseEvent, startTime: number) => {
        event.stopPropagation();
        if (onSeek) {
          onSeek(startTime);
        }
      },
      [onSeek]
    );

    const handleWordKeyDown = useCallback(
      (event: React.KeyboardEvent, startTime: number) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          if (onSeek) {
            onSeek(startTime);
          }
        }
      },
      [onSeek]
    );

    // 字幕导航功能
    const navigateToPreviousSubtitle = useCallback(() => {
      if (subtitleState.previousSubtitles.length > 0) {
        const previousSubtitle =
          subtitleState.previousSubtitles[subtitleState.previousSubtitles.length - 1];
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

    useEffect(() => {
      if (segments.length > 0) {
        const sync = new SubtitleSynchronizer(segments, {
          preloadTime: 0.5,
          postloadTime: 0.5,
          syncThreshold: 0.1,
          maxSubtitles: 3,
        });

        sync.onUpdate(setSubtitleState);
        setSynchronizer(sync);

        return () => {
          sync.destroy();
        };
      }
    }, [segments]);

    useEffect(() => {
      if (synchronizer) {
        synchronizer.updateTime(currentTime);
      }
    }, [currentTime, synchronizer]);

    // Update current word based on playback time
    useEffect(() => {
      if (subtitleState.currentSubtitle?.wordTimestamps) {
        const currentWord = WordTimestampService.getCurrentWord(
          currentTime,
          subtitleState.currentSubtitle.wordTimestamps
        );
        setCurrentWord(currentWord);
      } else {
        setCurrentWord(null);
      }
    }, [currentTime, subtitleState.currentSubtitle]);

    // Load terminology from database - memoized
    useEffect(() => {
      const loadTerminology = async () => {
        try {
          const terms = await DbUtils.getAllTerms();
          const terminologyMap = new Map<string, string>();

          terms.forEach((term) => {
            terminologyMap.set(term.word.toLowerCase(), term.meaning);
            if (term.reading) {
              terminologyMap.set(term.reading.toLowerCase(), term.meaning);
            }
          });

          setTerminology(terminologyMap);
        } catch (_error) {
          // Error loading terminology - silently fail
        }
      };

      loadTerminology();
    }, []);

    // Memoize subtitle rendering to prevent unnecessary re-renders
    const renderSubtitleText = useCallback(
      (subtitle: Subtitle, isActive: boolean = false) => {
        const handleWordClick = (startTime: number, event: React.MouseEvent) => {
          event.stopPropagation();
          if (onSeek) {
            onSeek(startTime);
          }
        };

        return (
          <SubtitleRenderer
            subtitle={subtitle}
            isActive={isActive}
            currentWord={currentWord}
            terminology={terminology}
            showTranslation={showTranslation}
            formatTime={formatTime}
            onSubtitleClick={handleSubtitleClick}
            onSubtitleKeyDown={handleSubtitleKeyDown}
            onWordClick={handleWordClick}
            onWordKeyDown={handleWordKeyDown}
          />
        );
      },
      [
        currentWord,
        terminology,
        showTranslation,
        handleSubtitleClick,
        handleSubtitleKeyDown,
        handleWordKeyDown,
        formatTime,
        onSeek,
      ]
    );

    // Memoize subtitle sections to avoid re-rendering when not necessary
    const previousSubtitlesSection = useMemo(() => {
      if (subtitleState.previousSubtitles.length === 0) return null;

      return (
        <div className="space-y-2 opacity-60">
          <h4 className="font-semibold text-gray-500 text-xs uppercase tracking-wide">Previous</h4>
          {subtitleState.previousSubtitles.map((subtitle) => (
            <div key={subtitle.id}>{renderSubtitleText(subtitle)}</div>
          ))}
        </div>
      );
    }, [subtitleState.previousSubtitles, renderSubtitleText]);

    const currentSubtitleSection = useMemo(() => {
      if (!subtitleState.currentSubtitle) return null;

      return (
        <div className="space-y-2">
          <h4 className="font-semibold text-blue-600 text-xs uppercase tracking-wide">Current</h4>
          {renderSubtitleText(subtitleState.currentSubtitle, true)}
        </div>
      );
    }, [subtitleState.currentSubtitle, renderSubtitleText]);

    const upcomingSubtitlesSection = useMemo(() => {
      if (subtitleState.upcomingSubtitles.length === 0) return null;

      return (
        <div className="space-y-2 opacity-80">
          <h4 className="font-semibold text-gray-500 text-xs uppercase tracking-wide">Upcoming</h4>
          {subtitleState.upcomingSubtitles.map((subtitle) => (
            <div key={subtitle.id}>{renderSubtitleText(subtitle)}</div>
          ))}
        </div>
      );
    }, [subtitleState.upcomingSubtitles, renderSubtitleText]);

    if (segments.length === 0) {
      return (
        <div className={`rounded-lg bg-muted/20 p-8 text-center ${className}`}>
          <div className="text-muted-foreground">
            <p className="mb-2 font-medium text-lg">No subtitles available</p>
            <p className="text-sm">Upload an audio file and transcribe it to see subtitles here.</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`space-y-4 ${className}`}>
        {/* 字幕控制面板 */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
                <Settings className="mr-2 h-4 w-4" />
                字幕设置
              </Button>
              <Badge variant="outline">{subtitleState.allSubtitles.length} 个字幕</Badge>
              {subtitleState.currentSubtitle && (
                <Badge variant="secondary">
                  当前: {formatTime(subtitleState.currentSubtitle.start)}
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateToPreviousSubtitle}
                disabled={subtitleState.previousSubtitles.length === 0}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateToCurrentSubtitle}
                disabled={!subtitleState.currentSubtitle}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateToNextSubtitle}
                disabled={subtitleState.upcomingSubtitles.length === 0}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 字幕设置面板 */}
          {showSettings && (
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label htmlFor={fontSizeId} className="font-medium text-sm">
                  字体大小
                </label>
                <Slider
                  id={fontSizeId}
                  value={fontSize}
                  min={12}
                  max={24}
                  step={1}
                  onValueChange={setFontSize}
                  className="w-full"
                />
                <span className="text-muted-foreground text-xs">{fontSize[0]}px</span>
              </div>

              <div className="space-y-2">
                <label htmlFor={lineHeightId} className="font-medium text-sm">
                  行高
                </label>
                <Slider
                  id={lineHeightId}
                  value={lineHeight}
                  min={1}
                  max={2}
                  step={0.1}
                  onValueChange={setLineHeight}
                  className="w-full"
                />
                <span className="text-muted-foreground text-xs">{lineHeight[0]}</span>
              </div>

              <div className="space-y-2">
                <label htmlFor={maxSubtitlesId} className="font-medium text-sm">
                  显示数量
                </label>
                <Slider
                  id={maxSubtitlesId}
                  value={maxSubtitles}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={setMaxSubtitles}
                  className="w-full"
                />
                <span className="text-muted-foreground text-xs">{maxSubtitles[0]} 个</span>
              </div>

              <fieldset className="space-y-2">
                <legend className="font-medium text-sm">显示选项</legend>
                <div className="space-y-1">
                  <label className="flex items-center space-x-2 text-xs">
                    <input
                      type="checkbox"
                      checked={showPrevious}
                      onChange={(e) => setShowPrevious(e.target.checked)}
                    />
                    <span>显示前序</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs">
                    <input
                      type="checkbox"
                      checked={showUpcoming}
                      onChange={(e) => setShowUpcoming(e.target.checked)}
                    />
                    <span>显示后续</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs">
                    <input
                      type="checkbox"
                      checked={highlightCurrent}
                      onChange={(e) => setHighlightCurrent(e.target.checked)}
                    />
                    <span>高亮当前</span>
                  </label>
                </div>
              </fieldset>
            </div>
          )}
        </Card>

        {/* Previous Subtitles */}
        {showPrevious && previousSubtitlesSection}

        {/* Current Subtitle */}
        {currentSubtitleSection}

        {/* Upcoming Subtitles */}
        {showUpcoming && upcomingSubtitlesSection}

        {/* Progress Indicator */}
        <div className="border-border border-t pt-4">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>{subtitleState.allSubtitles.length} 个字幕已加载</span>
            <span>{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>
    );
  }
);

SubtitleDisplay.displayName = 'SubtitleDisplay';

export default SubtitleDisplay;
