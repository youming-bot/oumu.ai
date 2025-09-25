"use client";

import React from "react";

interface WordWithTimingProps {
  timestamp: { word: string; start: number; end: number };
  isCurrentWord: boolean;
  onWordClick: (startTime: number, event: React.MouseEvent) => void;
  onWordKeyDown: (event: React.KeyboardEvent, startTime: number) => void;
}

export const WordWithTiming = React.memo<WordWithTimingProps>(
  ({ timestamp, isCurrentWord, onWordClick, onWordKeyDown }) => {
    let wordClass = "transition-all duration-150";

    if (isCurrentWord) {
      wordClass += " bg-primary-light text-primary font-bold px-1 rounded scale-105";
    }

    return (
      <button
        type="button"
        className={`${wordClass} m-0 border-none bg-transparent p-0`}
        title={undefined}
        data-start={timestamp.start}
        data-end={timestamp.end}
        onClick={(e) => {
          e.stopPropagation();
          onWordClick(timestamp.start, e);
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          onWordKeyDown(e, timestamp.start);
        }}
        aria-label={`Word: ${timestamp.word}`}
      >
        {timestamp.word}
      </button>
    );
  },
);

WordWithTiming.displayName = "WordWithTiming";
