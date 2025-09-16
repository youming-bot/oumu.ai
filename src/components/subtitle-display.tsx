'use client';

import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { Subtitle, SubtitleSynchronizer, SubtitleState } from '@/lib/subtitle-sync';
import { Segment } from '@/types/database';
import { DBUtils } from '@/lib/db';
import { WordTimestampService } from '@/lib/word-timestamp-service';

interface SubtitleDisplayProps {
  segments: Segment[];
  currentTime: number;
  isPlaying: boolean;
  onSeek?: (time: number) => void;
  showTranslation?: boolean;
  className?: string;
}

export default function SubtitleDisplay({
  segments,
  currentTime,
  onSeek,
  showTranslation = true,
  className = '',
}: SubtitleDisplayProps) {
  const [subtitleState, setSubtitleState] = useState<SubtitleState>({
    currentSubtitle: null,
    upcomingSubtitles: [],
    previousSubtitles: [],
    allSubtitles: [],
  });

  const [synchronizer, setSynchronizer] = useState<SubtitleSynchronizer | null>(null);
  const [terminology, setTerminology] = useState<Map<string, string>>(new Map());
  const [currentWord, setCurrentWord] = useState<{ word: string; index: number } | null>(null);

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
    if (subtitleState.currentSubtitle && subtitleState.currentSubtitle.wordTimestamps) {
      const currentWord = WordTimestampService.getCurrentWord(
        currentTime,
        subtitleState.currentSubtitle.wordTimestamps
      );
      setCurrentWord(currentWord);
    } else {
      setCurrentWord(null);
    }
  }, [currentTime, subtitleState.currentSubtitle]);

  // Load terminology from database
  useEffect(() => {
    const loadTerminology = async () => {
      try {
        const terms = await DBUtils.getAllTerms();
        const terminologyMap = new Map<string, string>();

        terms.forEach(term => {
          terminologyMap.set(term.word.toLowerCase(), term.meaning);
          if (term.reading) {
            terminologyMap.set(term.reading.toLowerCase(), term.meaning);
          }
        });

        setTerminology(terminologyMap);
      } catch (error) {
        console.error('Failed to load terminology:', error);
      }
    };

    loadTerminology();
  }, []);

  const handleSubtitleClick = (subtitle: Subtitle) => {
    if (onSeek) {
      onSeek(subtitle.start);
    }
  };

  const handleWordClick = (event: React.MouseEvent, startTime: number) => {
    event.stopPropagation();
    if (onSeek) {
      onSeek(startTime);
    }
  };

  const sanitizeHTML = (html: string): string => {
    // Configure DOMPurify to allow only safe HTML tags and attributes
    const config = {
      ALLOWED_TAGS: ['span', 'br'],
      ALLOWED_ATTR: ['class', 'title', 'data-start', 'data-end'],
      KEEP_CONTENT: true,
    };
    return DOMPurify.sanitize(html, config);
  };

  const renderSubtitleText = (subtitle: Subtitle, isActive: boolean = false) => {
    let text = subtitle.normalizedText || subtitle.text;

    // Word-level highlighting with timing synchronization
    if (subtitle.wordTimestamps && subtitle.wordTimestamps.length > 0) {
      const wordsWithTiming = subtitle.wordTimestamps.map((timestamp, index) => {
        const isCurrentWord = isActive && currentWord && currentWord.index === index;
        const cleanWord = timestamp.word.replace(/[.,!?;:"']/g, '').toLowerCase();
        const hasTerminology = terminology.has(cleanWord);

        let wordClass = 'transition-all duration-150';

        if (isCurrentWord) {
          wordClass += ' bg-blue-200 text-blue-900 font-bold px-1 rounded scale-105';
        } else if (hasTerminology) {
          wordClass += ' bg-yellow-100 text-yellow-800 px-1 rounded border border-yellow-300';
        }

        let titleAttr = '';
        if (hasTerminology) {
          titleAttr = `title="${terminology.get(cleanWord)}"`;
        }

        return `<span class="${wordClass}" ${titleAttr} data-start="${timestamp.start}" data-end="${timestamp.end}">${timestamp.word}</span>`;
      });

      text = wordsWithTiming.join(' ');
    } else {
      // Fallback: Highlight terminology in the text (legacy mode)
      if (terminology.size > 0) {
        const words = text.split(/\s+/);
        const highlightedWords = words.map(word => {
          const cleanWord = word.replace(/[.,!?;:"']/g, '').toLowerCase();
          if (terminology.has(cleanWord)) {
            return `<span class="bg-yellow-100 text-yellow-800 px-1 rounded border border-yellow-300" title="${terminology.get(cleanWord)}">${word}</span>`;
          }
          return word;
        });
        text = highlightedWords.join(' ');
      }
    }

    if (showTranslation && subtitle.translation) {
      text += `\n<span class="text-gray-600 text-sm">${subtitle.translation}</span>`;
    }

    if (subtitle.annotations && subtitle.annotations.length > 0) {
      text += `\n<span class="text-blue-600 text-xs">${subtitle.annotations.join(', ')}</span>`;
    }

    // Add terminology explanations if available
    const terminologyExplanations: string[] = [];
    if (terminology.size > 0 && subtitle.text) {
      const words = subtitle.text.split(/\s+/);
      words.forEach(word => {
        const cleanWord = word.replace(/[.,!?;:"']/g, '').toLowerCase();
        if (terminology.has(cleanWord)) {
          terminologyExplanations.push(`<span class="font-medium">${word}</span>: ${terminology.get(cleanWord)}`);
        }
      });
    }

    if (terminologyExplanations.length > 0) {
      text += `\n<span class="text-green-600 text-xs">${terminologyExplanations.join('<br/>')}</span>`;
    }

    return (
      <div
        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
          isActive
            ? 'bg-blue-100 border-2 border-blue-300 shadow-md'
            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
        }`}
        onClick={() => handleSubtitleClick(subtitle)}
      >
        <div
          className="text-gray-900 font-medium"
          dangerouslySetInnerHTML={{
            __html: sanitizeHTML(text.replace(/\n/g, '<br/>'))
          }}
          onClick={(e) => {
            // Handle word clicks for seeking
            const target = e.target as HTMLElement;
            if (target.hasAttribute('data-start')) {
              const startTime = parseFloat(target.getAttribute('data-start') || '0');
              handleWordClick(e, startTime);
            }
          }}
        />
        {subtitle.furigana && (
          <div className="text-gray-500 text-sm mt-1">
            {subtitle.furigana}
          </div>
        )}
        <div className="text-xs text-gray-400 mt-2">
          {formatTime(subtitle.start)} - {formatTime(subtitle.end)}
        </div>
      </div>
    );
  };

  if (segments.length === 0) {
    return (
      <div className={`bg-white rounded-lg p-8 text-center ${className}`}>
        <div className="text-gray-500">
          <p className="text-lg font-medium mb-2">No subtitles available</p>
          <p className="text-sm">Upload an audio file and transcribe it to see subtitles here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Previous Subtitles */}
      {subtitleState.previousSubtitles.length > 0 && (
        <div className="space-y-2 opacity-60">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Previous
          </h4>
          {subtitleState.previousSubtitles.map((subtitle) => (
            <div key={subtitle.id}>
              {renderSubtitleText(subtitle)}
            </div>
          ))}
        </div>
      )}

      {/* Current Subtitle */}
      {subtitleState.currentSubtitle && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
            Current
          </h4>
          {renderSubtitleText(subtitleState.currentSubtitle, true)}
        </div>
      )}

      {/* Upcoming Subtitles */}
      {subtitleState.upcomingSubtitles.length > 0 && (
        <div className="space-y-2 opacity-80">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Upcoming
          </h4>
          {subtitleState.upcomingSubtitles.map((subtitle) => (
            <div key={subtitle.id}>
              {renderSubtitleText(subtitle)}
            </div>
          ))}
        </div>
      )}

      {/* Progress Indicator */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>
            {subtitleState.allSubtitles.length} subtitles loaded
          </span>
          <span>
            {formatTime(currentTime)}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}