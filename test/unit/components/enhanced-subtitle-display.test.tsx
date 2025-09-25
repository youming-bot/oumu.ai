import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EnhancedSubtitleDisplay } from "@/components/enhanced-subtitle-display";
import type { Segment } from "@/types/database";

// Mock the ruby text processor
jest.mock("@/lib/ruby-text-processor", () => ({
  processSegmentRuby: jest.fn(),
  getHighlightedCharacters: jest.fn(),
  containsJapanese: jest.fn(() => true),
  getTextLanguageStats: jest.fn(),
}));

// Mock the subtitle sync
jest.mock("@/lib/subtitle-sync", () => ({
  SubtitleSynchronizer: jest.fn().mockImplementation(() => ({
    updateTime: jest.fn(),
    onUpdate: jest.fn(),
    destroy: jest.fn(),
  })),
}));

// Mock the word timestamp service
jest.mock("@/lib/word-timestamp-service", () => ({
  WordTimestampService: {
    getCurrentWord: jest.fn(),
  },
}));

describe("EnhancedSubtitleDisplay", () => {
  const mockSegments: Segment[] = [
    {
      id: 1,
      transcriptId: 1,
      start: 0,
      end: 5,
      text: "こんにちは世界",
      normalizedText: "こんにちは世界",
      translation: "你好世界",
      furigana: "こんにちは|こんにちわ 世界|せかい",
      annotations: ["konnichiwa sekai"],
      wordTimestamps: [
        { word: "こんにちは", start: 0, end: 2.5 },
        { word: "世界", start: 2.5, end: 5 },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockOnSeek = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock ruby processor functions
    const {
      processSegmentRuby,
      getHighlightedCharacters,
    } = require("@/lib/ruby-text-processor");
    processSegmentRuby.mockReturnValue([
      {
        text: "こんにちは",
        characters: [
          { character: "こ", furigana: "こ", romaji: "ko" },
          { character: "ん", furigana: "ん", romaji: "n" },
          { character: "に", furigana: "に", romaji: "ni" },
          { character: "ち", furigana: "ち", romaji: "chi" },
          { character: "は", furigana: "は", romaji: "wa" },
        ],
        romaji: "konnichiwa",
        startTime: 0,
        endTime: 2.5,
      },
      {
        text: "世界",
        characters: [
          { character: "世", furigana: "せ", romaji: "se" },
          { character: "界", furigana: "かい", romaji: "kai" },
        ],
        romaji: "sekai",
        startTime: 2.5,
        endTime: 5,
      },
    ]);

    getHighlightedCharacters.mockReturnValue({ wordIndex: 0, charIndex: 2 });
  });

  it("renders without crashing", () => {
    render(
      <EnhancedSubtitleDisplay
        segments={mockSegments}
        currentTime={0}
        isPlaying={false}
        onSeek={mockOnSeek}
      />,
    );

    expect(screen.getByText("没有可用的字幕")).toBeInTheDocument();
  });

  it("displays subtitle when segments are provided", async () => {
    // Mock the subtitle synchronizer to return current subtitle
    const { SubtitleSynchronizer } = require("@/lib/subtitle-sync");
    let updateCallback: any;

    SubtitleSynchronizer.mockImplementation(() => ({
      updateTime: jest.fn(),
      onUpdate: (callback: any) => {
        updateCallback = callback;
      },
      destroy: jest.fn(),
    }));

    render(
      <EnhancedSubtitleDisplay
        segments={mockSegments}
        currentTime={1}
        isPlaying={false}
        onSeek={mockOnSeek}
      />,
    );

    // Simulate subtitle state update
    if (updateCallback) {
      updateCallback({
        currentSubtitle: mockSegments[0],
        upcomingSubtitles: [],
        previousSubtitles: [],
        allSubtitles: mockSegments,
      });
    }

    await waitFor(() => {
      expect(screen.getByText("こんにちは世界")).toBeInTheDocument();
    });
  });

  it("handles word click events", async () => {
    const { SubtitleSynchronizer } = require("@/lib/subtitle-sync");
    let updateCallback: any;

    SubtitleSynchronizer.mockImplementation(() => ({
      updateTime: jest.fn(),
      onUpdate: (callback: any) => {
        updateCallback = callback;
      },
      destroy: jest.fn(),
    }));

    render(
      <EnhancedSubtitleDisplay
        segments={mockSegments}
        currentTime={1}
        isPlaying={false}
        onSeek={mockOnSeek}
      />,
    );

    // Simulate subtitle state update
    if (updateCallback) {
      updateCallback({
        currentSubtitle: mockSegments[0],
        upcomingSubtitles: [],
        previousSubtitles: [],
        allSubtitles: mockSegments,
      });
    }

    await waitFor(() => {
      const wordButton = screen.getByText("こんにちは");
      fireEvent.click(wordButton);
      expect(mockOnSeek).toHaveBeenCalledWith(0);
    });
  });

  it("shows and hides settings panel", async () => {
    const { SubtitleSynchronizer } = require("@/lib/subtitle-sync");
    let updateCallback: any;

    SubtitleSynchronizer.mockImplementation(() => ({
      updateTime: jest.fn(),
      onUpdate: (callback: any) => {
        updateCallback = callback;
      },
      destroy: jest.fn(),
    }));

    render(
      <EnhancedSubtitleDisplay
        segments={mockSegments}
        currentTime={1}
        isPlaying={false}
        onSeek={mockOnSeek}
      />,
    );

    // Simulate subtitle state update
    if (updateCallback) {
      updateCallback({
        currentSubtitle: mockSegments[0],
        upcomingSubtitles: [],
        previousSubtitles: [],
        allSubtitles: mockSegments,
      });
    }

    const settingsButton = screen.getByLabelText("显示字幕设置");
    fireEvent.click(settingsButton);

    await waitFor(() => {
      expect(screen.getByLabelText("字幕设置对话框")).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText("关闭设置");
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByLabelText("字幕设置对话框")).not.toBeInTheDocument();
    });
  });

  it("handles navigation buttons", async () => {
    const { SubtitleSynchronizer } = require("@/lib/subtitle-sync");
    let updateCallback: any;

    SubtitleSynchronizer.mockImplementation(() => ({
      updateTime: jest.fn(),
      onUpdate: (callback: any) => {
        updateCallback = callback;
      },
      destroy: jest.fn(),
    }));

    render(
      <EnhancedSubtitleDisplay
        segments={mockSegments}
        currentTime={1}
        isPlaying={false}
        onSeek={mockOnSeek}
      />,
    );

    // Simulate subtitle state update with previous and next subtitles
    if (updateCallback) {
      updateCallback({
        currentSubtitle: mockSegments[0],
        upcomingSubtitles: [mockSegments[0]],
        previousSubtitles: [mockSegments[0]],
        allSubtitles: mockSegments,
      });
    }

    await waitFor(() => {
      const nextButton = screen.getByLabelText("下一个字幕");
      fireEvent.click(nextButton);
      expect(mockOnSeek).toHaveBeenCalledWith(0);
    });
  });

  it("updates font size when slider changes", async () => {
    const { SubtitleSynchronizer } = require("@/lib/subtitle-sync");
    let updateCallback: any;

    SubtitleSynchronizer.mockImplementation(() => ({
      updateTime: jest.fn(),
      onUpdate: (callback: any) => {
        updateCallback = callback;
      },
      destroy: jest.fn(),
    }));

    render(
      <EnhancedSubtitleDisplay
        segments={mockSegments}
        currentTime={1}
        isPlaying={false}
        onSeek={mockOnSeek}
      />,
    );

    // Simulate subtitle state update
    if (updateCallback) {
      updateCallback({
        currentSubtitle: mockSegments[0],
        upcomingSubtitles: [],
        previousSubtitles: [],
        allSubtitles: mockSegments,
      });
    }

    // Open settings
    const settingsButton = screen.getByLabelText("显示字幕设置");
    fireEvent.click(settingsButton);

    await waitFor(() => {
      const fontSizeSlider = screen.getByLabelText("字体大小");
      fireEvent.change(fontSizeSlider, { target: { value: "30" } });
    });
  });

  it("displays translation when enabled", async () => {
    const { SubtitleSynchronizer } = require("@/lib/subtitle-sync");
    let updateCallback: any;

    SubtitleSynchronizer.mockImplementation(() => ({
      updateTime: jest.fn(),
      onUpdate: (callback: any) => {
        updateCallback = callback;
      },
      destroy: jest.fn(),
    }));

    render(
      <EnhancedSubtitleDisplay
        segments={mockSegments}
        currentTime={1}
        isPlaying={false}
        onSeek={mockOnSeek}
        showTranslation={true}
      />,
    );

    // Simulate subtitle state update
    if (updateCallback) {
      updateCallback({
        currentSubtitle: mockSegments[0],
        upcomingSubtitles: [],
        previousSubtitles: [],
        allSubtitles: mockSegments,
      });
    }

    await waitFor(() => {
      expect(screen.getByText("你好世界")).toBeInTheDocument();
    });
  });

  it("hides translation when disabled", async () => {
    const { SubtitleSynchronizer } = require("@/lib/subtitle-sync");
    let updateCallback: any;

    SubtitleSynchronizer.mockImplementation(() => ({
      updateTime: jest.fn(),
      onUpdate: (callback: any) => {
        updateCallback = callback;
      },
      destroy: jest.fn(),
    }));

    render(
      <EnhancedSubtitleDisplay
        segments={mockSegments}
        currentTime={1}
        isPlaying={false}
        onSeek={mockOnSeek}
        showTranslation={false}
      />,
    );

    // Simulate subtitle state update
    if (updateCallback) {
      updateCallback({
        currentSubtitle: mockSegments[0],
        upcomingSubtitles: [],
        previousSubtitles: [],
        allSubtitles: mockSegments,
      });
    }

    await waitFor(() => {
      expect(screen.queryByText("你好世界")).not.toBeInTheDocument();
    });
  });
});
