'use client';

import React from 'react';

interface TerminologyHighlighterProps {
  word: string;
  terminology: Map<string, string>;
  onWordClick: (startTime: number, event: React.MouseEvent) => void;
  onWordKeyDown: (event: React.KeyboardEvent, startTime: number) => void;
}

export const TerminologyHighlighter = React.memo<TerminologyHighlighterProps>(
  ({ word, terminology, onWordClick, onWordKeyDown }) => {
    const cleanWord = word.replace(/[.,!?;:"']/g, '').toLowerCase();
    const hasTerminology = terminology.has(cleanWord);
    const terminologyMeaning = hasTerminology ? terminology.get(cleanWord) : undefined;

    if (hasTerminology) {
      return (
        <button
          type="button"
          className="m-0 rounded border border-yellow-300 border-none bg-transparent bg-yellow-100 p-0 px-1 text-yellow-800"
          title={terminologyMeaning}
          onClick={(e) => {
            e.stopPropagation();
            onWordClick(0, e); // No specific time for terminology words
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
            onWordKeyDown(e, 0); // No specific time for terminology words
          }}
          aria-label={`Terminology: ${word}`}
        >
          {word}
        </button>
      );
    }

    return <>{word}</>;
  }
);

TerminologyHighlighter.displayName = 'TerminologyHighlighter';
