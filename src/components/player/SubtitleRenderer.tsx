"use client";

import React from "react";
import type { Subtitle } from "@/lib/subtitle-sync";

interface WordWithTimingProps {
  timestamp: {
    word: string;
    start: number;
    end: number;
  };
  isCurrentWord: boolean;
  onWordClick: (startTime: number, event: React.MouseEvent) => void;
  onWordKeyDown: (event: React.KeyboardEvent, startTime: number) => void;
}

const WordWithTiming = React.memo<WordWithTimingProps>(
  ({ timestamp, isCurrentWord, onWordClick, onWordKeyDown }) => {
    return (
      <span
        className={`cursor-pointer transition-colors ${
          isCurrentWord
            ? "font-semibold text-[var(--state-info-text)] dark:text-[var(--state-info-strong)]"
            : "text-[var(--text-secondary)] hover:text-[var(--state-info-text)] dark:hover:text-[var(--state-info-strong)]"
        }`}
        onClick={(e) => onWordClick(timestamp.start, e)}
        onKeyDown={(e) => onWordKeyDown(e, timestamp.start)}
        tabIndex={0}
        role="button"
      >
        {timestamp.word}
      </span>
    );
  },
);

WordWithTiming.displayName = "WordWithTiming";

interface SubtitleRendererProps {
  subtitle: Subtitle;
  isActive: boolean;
  currentWord: { word: string; index: number } | null;
  formatTime: (seconds: number) => string;
  onSubtitleClick: (subtitle: Subtitle) => void;
  onSubtitleKeyDown: (event: React.KeyboardEvent, subtitle: Subtitle) => void;
  onWordClick: (startTime: number, event: React.MouseEvent) => void;
  onWordKeyDown: (event: React.KeyboardEvent, startTime: number) => void;
}

export const SubtitleRenderer = React.memo<SubtitleRendererProps>(
  ({ subtitle, isActive, currentWord, formatTime, onWordClick, onWordKeyDown }) => {
    // Render word timestamps if available
    const renderWordTimestamps = () => {
      if (!subtitle.wordTimestamps || subtitle.wordTimestamps.length === 0) {
        return null;
      }

      return (
        <>
          {subtitle.wordTimestamps.map((timestamp, index) => {
            const isCurrentWord = !!(isActive && currentWord && currentWord.index === index);

            return (
              <React.Fragment
                key={`word-${index}-${timestamp.word.substring(0, 10)}-${timestamp.start}`}
              >
                <WordWithTiming
                  timestamp={timestamp}
                  isCurrentWord={isCurrentWord}
                  onWordClick={onWordClick}
                  onWordKeyDown={onWordKeyDown}
                />
                {index < (subtitle.wordTimestamps?.length || 0) - 1 && " "}
              </React.Fragment>
            );
          })}
        </>
      );
    };

    // Fallback: Render plain text
    const renderPlainText = () => {
      const text = subtitle.normalizedText || subtitle.text;
      return text;
    };

    // Render terminology explanations
    const renderTerminologyExplanations = () => {
      return null;
    };

    // Render annotations and furigana
    const renderAdditionalInfo = () => {
      const elements = [];

      if (subtitle.furigana) {
        elements.push(
          <div
            key="furigana"
            className="mt-1 text-sm text-[var(--state-info-text)] dark:text-[var(--state-info-strong)]"
          >
            {subtitle.furigana}
          </div>,
        );
      }

      if (subtitle.annotations && subtitle.annotations.length > 0) {
        elements.push(
          <div key="annotations" className="mt-1 text-xs text-[var(--color-primary)]">
            {subtitle.annotations.join(" • ")}
          </div>,
        );
      }

      return elements.length > 0 ? <div className="mt-1 space-y-1">{elements}</div> : null;
    };

    return (
      <div className="space-y-2">
        {/* Main text content */}
        <div className="font-medium leading-relaxed">
          {subtitle.wordTimestamps && subtitle.wordTimestamps.length > 0
            ? renderWordTimestamps()
            : renderPlainText()}
        </div>

        {/* Additional info (annotations, furigana) */}
        {renderAdditionalInfo()}

        {/* Terminology explanations */}
        {renderTerminologyExplanations()}

        {/* Timing indicator */}
        <div className="text-xs opacity-70 text-[var(--text-muted)]">
          {formatTime(subtitle.start)} - {formatTime(subtitle.end)}
        </div>
      </div>
    );
  },
);

SubtitleRenderer.displayName = "SubtitleRenderer";
