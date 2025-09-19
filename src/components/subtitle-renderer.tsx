'use client';

import React, { type ReactElement } from 'react';
import type { Subtitle } from '@/lib/subtitle-sync';
import { TerminologyHighlighter } from './terminology-highlighter';
import { WordWithTiming } from './word-with-timing';

interface SubtitleRendererProps {
  subtitle: Subtitle;
  isActive: boolean;
  currentWord: { word: string; index: number } | null;
  terminology: Map<string, string>;
  showTranslation: boolean;
  formatTime: (seconds: number) => string;
  onSubtitleClick: (subtitle: Subtitle) => void;
  onSubtitleKeyDown: (event: React.KeyboardEvent, subtitle: Subtitle) => void;
  onWordClick: (startTime: number, event: React.MouseEvent) => void;
  onWordKeyDown: (event: React.KeyboardEvent, startTime: number) => void;
}

export const SubtitleRenderer = React.memo<SubtitleRendererProps>(
  ({
    subtitle,
    isActive,
    currentWord,
    terminology,
    showTranslation,
    formatTime,
    onSubtitleClick,
    onSubtitleKeyDown,
    onWordClick,
    onWordKeyDown,
  }) => {
    // Render word timestamps if available
    const renderWordTimestamps = () => {
      if (!subtitle.wordTimestamps || subtitle.wordTimestamps.length === 0) {
        return null;
      }

      return (
        <>
          {subtitle.wordTimestamps.map((timestamp, index) => {
            const isCurrentWord = !!(isActive && currentWord && currentWord.index === index);
            const cleanWord = timestamp.word.replace(/[.,!?;:"']/g, '').toLowerCase();
            const hasTerminology = terminology.has(cleanWord);
            const terminologyMeaning = hasTerminology ? terminology.get(cleanWord) : undefined;

            return (
              <React.Fragment
                key={`word-${index}-${timestamp.word.substring(0, 10)}-${timestamp.start}`}
              >
                <WordWithTiming
                  timestamp={timestamp}
                  isCurrentWord={isCurrentWord}
                  hasTerminology={hasTerminology}
                  terminologyMeaning={terminologyMeaning}
                  onWordClick={onWordClick}
                  onWordKeyDown={onWordKeyDown}
                />
                {index < (subtitle.wordTimestamps?.length || 0) - 1 && ' '}
              </React.Fragment>
            );
          })}
        </>
      );
    };

    // Fallback: Render plain text with terminology highlighting
    const renderPlainText = () => {
      const text = subtitle.normalizedText || subtitle.text;
      if (terminology.size === 0) {
        return text;
      }

      const words = text.split(/\s+/);
      return words.map((word, index) => (
        <React.Fragment key={`plain-${index}-${word.substring(0, 10)}`}>
          <TerminologyHighlighter
            word={word}
            terminology={terminology}
            onWordClick={onWordClick}
            onWordKeyDown={onWordKeyDown}
          />
          {index < words.length - 1 && ' '}
        </React.Fragment>
      ));
    };

    // Render terminology explanations
    const renderTerminologyExplanations = () => {
      if (terminology.size === 0 || !subtitle.text) {
        return null;
      }

      const terminologyExplanations: ReactElement[] = [];
      const words = subtitle.text.split(/\s+/);

      words.forEach((word, index) => {
        const cleanWord = word.replace(/[.,!?;:"']/g, '').toLowerCase();
        if (terminology.has(cleanWord)) {
          terminologyExplanations.push(
            <div key={`explanation-${index}-${cleanWord}`} className="text-green-600 text-xs">
              <span className="font-medium">{word}</span>: {terminology.get(cleanWord)}
            </div>
          );
        }
      });

      return terminologyExplanations.length > 0 ? (
        <div className="mt-1">{terminologyExplanations}</div>
      ) : null;
    };

    return (
      <button
        type="button"
        className={`cursor-pointer rounded-lg border p-3 text-left transition-all duration-200 ${
          isActive
            ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20'
            : 'border-border bg-card hover:border-primary/50 hover:bg-accent'
        }`}
        onClick={() => onSubtitleClick(subtitle)}
        onKeyDown={(e) => onSubtitleKeyDown(e, subtitle)}
      >
        {/* Main text content */}
        <div className="font-medium text-gray-900">
          {subtitle.wordTimestamps && subtitle.wordTimestamps.length > 0
            ? renderWordTimestamps()
            : renderPlainText()}
        </div>

        {/* Translation */}
        {showTranslation && subtitle.translation && (
          <div className="mt-1 text-muted-foreground text-sm">{subtitle.translation}</div>
        )}

        {/* Annotations */}
        {subtitle.annotations && subtitle.annotations.length > 0 && (
          <div className="mt-1 text-primary text-xs">{subtitle.annotations.join(', ')}</div>
        )}

        {/* Terminology explanations */}
        {renderTerminologyExplanations()}

        {/* Furigana */}
        {subtitle.furigana && (
          <div className="mt-1 text-muted-foreground text-sm">{subtitle.furigana}</div>
        )}

        {/* Timing */}
        <div className="mt-2 text-muted-foreground text-xs">
          {formatTime(subtitle.start)} - {formatTime(subtitle.end)}
        </div>
      </button>
    );
  }
);

SubtitleRenderer.displayName = 'SubtitleRenderer';
