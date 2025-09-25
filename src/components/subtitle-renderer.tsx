"use client";

import React from "react";
import type { Subtitle } from "@/lib/subtitle-sync";
import { WordWithTiming } from "./word-with-timing";

interface SubtitleRendererProps {
  subtitle: Subtitle;
  isActive: boolean;
  currentWord: { word: string; index: number } | null;
  _showTranslation: boolean;
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
    _showTranslation,
    formatTime,
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
          <div key="furigana" className="mt-1 text-indigo-600 text-sm dark:text-indigo-400">
            {subtitle.furigana}
          </div>,
        );
      }

      if (subtitle.annotations && subtitle.annotations.length > 0) {
        elements.push(
          <div key="annotations" className="mt-1 text-primary text-xs">
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
        <div className="text-gray-500 text-xs opacity-70 dark:text-gray-400">
          {formatTime(subtitle.start)} - {formatTime(subtitle.end)}
        </div>
      </div>
    );
  },
);

SubtitleRenderer.displayName = "SubtitleRenderer";
