import {
  calculateSpeakingRate,
  convertWordTimestampsToSrtFormat,
  exportWordTimestampsToJson,
  findPauses,
  generateWordTimestamps,
  getCurrentWord,
  getWordContext,
  mergeWordTimestamps,
  smoothTimestamps,
} from "@/lib/word-timestamp-service";

describe("Word Timestamp Service", () => {
  describe("generateWordTimestamps", () => {
    test("should generate timestamps for simple text", () => {
      // Arrange
      const text = "Hello world";
      const start = 0;
      const end = 5;

      // Act
      const timestamps = generateWordTimestamps(text, start, end);

      // Assert
      expect(timestamps).toHaveLength(2);
      expect(timestamps[0].word).toBe("Hello");
      expect(timestamps[1].word).toBe("world");
      expect(timestamps[0].start).toBeCloseTo(0, 1);
      expect(timestamps[1].end).toBeCloseTo(5, 1);
      expect(timestamps[0].end).toBeLessThanOrEqual(timestamps[1].start);
      expect(timestamps.every((ts) => ts.confidence === 0.7)).toBe(true);
    });

    test("should handle empty text", () => {
      // Act
      const timestamps = generateWordTimestamps("", 0, 5);

      // Assert
      expect(timestamps).toHaveLength(0);
    });

    test("should handle text with multiple spaces", () => {
      // Arrange
      const text = "  Hello   world  test  ";

      // Act
      const timestamps = generateWordTimestamps(text, 0, 10);

      // Assert
      expect(timestamps).toHaveLength(3);
      expect(timestamps.map((ts) => ts.word)).toEqual(["Hello", "world", "test"]);
    });

    test("should ensure minimum word duration", () => {
      // Arrange
      const text = "a b c d e";

      // Act
      const timestamps = generateWordTimestamps(text, 0, 0.5);

      // Assert
      timestamps.forEach((ts) => {
        // The algorithm ensures minimum duration of 0.1 seconds
        expect(ts.end - ts.start).toBeGreaterThan(0.09); // Allow floating point tolerance
      });
    });
  });

  describe("getCurrentWord", () => {
    const mockTimestamps = [
      { word: "Hello", start: 0, end: 2, confidence: 0.9 },
      { word: "world", start: 2, end: 4, confidence: 0.8 },
      { word: "test", start: 4, end: 6, confidence: 0.7 },
    ];

    test("should find current word at different times", () => {
      // Act & Assert
      expect(getCurrentWord(1, mockTimestamps)?.word).toBe("Hello");
      expect(getCurrentWord(2.1, mockTimestamps)?.word).toBe("world"); // Use 2.1 to avoid boundary
      expect(getCurrentWord(3, mockTimestamps)?.word).toBe("world");
      expect(getCurrentWord(5, mockTimestamps)?.word).toBe("test");
    });

    test("should return null for times outside timestamps", () => {
      // Act & Assert
      expect(getCurrentWord(-1, mockTimestamps)).toBeNull();
      expect(getCurrentWord(7, mockTimestamps)).toBeNull();
    });

    test("should return correct index", () => {
      // Act
      const result = getCurrentWord(3, mockTimestamps);

      // Assert
      expect(result?.index).toBe(1);
      expect(result?.word).toBe("world");
    });
  });

  describe("getWordContext", () => {
    const mockTimestamps = [
      { word: "The", start: 0, end: 0.5 },
      { word: "quick", start: 0.5, end: 1.0 },
      { word: "brown", start: 1.0, end: 1.5 },
      { word: "fox", start: 1.5, end: 2.0 },
      { word: "jumps", start: 2.0, end: 2.5 },
    ];

    test("should get context around current word", () => {
      // Act
      const context = getWordContext(1.2, mockTimestamps, 1);

      // Assert
      expect(context.current?.word).toBe("brown");
      expect(context.previous).toHaveLength(1);
      expect(context.previous[0].word).toBe("quick");
      expect(context.next).toHaveLength(1);
      expect(context.next[0].word).toBe("fox");
    });

    test("should handle beginning of array", () => {
      // Act
      const context = getWordContext(0.2, mockTimestamps, 2);

      // Assert
      expect(context.current?.word).toBe("The");
      expect(context.previous).toHaveLength(0);
      expect(context.next).toHaveLength(2);
      expect(context.next.map((ts) => ts.word)).toEqual(["quick", "brown"]);
    });

    test("should handle end of array", () => {
      // Act
      const context = getWordContext(2.4, mockTimestamps, 2);

      // Assert
      expect(context.current?.word).toBe("jumps");
      expect(context.previous).toHaveLength(2);
      expect(context.previous.map((ts) => ts.word)).toEqual(["brown", "fox"]);
      expect(context.next).toHaveLength(0);
    });

    test("should return empty context when no current word", () => {
      // Act
      const context = getWordContext(10, mockTimestamps, 2);

      // Assert
      expect(context.current).toBeNull();
      expect(context.previous).toHaveLength(0);
      expect(context.next).toHaveLength(0);
    });
  });

  describe("calculateSpeakingRate", () => {
    test("should calculate words per minute correctly", () => {
      // Arrange
      const timestamps = [
        { word: "a", start: 0, end: 0.5 },
        { word: "b", start: 0.5, end: 1.0 },
        { word: "c", start: 1.0, end: 1.5 },
        { word: "d", start: 1.5, end: 2.0 },
      ];

      // Act
      const rate = calculateSpeakingRate(timestamps);

      // Assert - 4 words in 2 seconds = 120 WPM
      expect(rate).toBeCloseTo(120, 0);
    });

    test("should return 0 for insufficient data", () => {
      // Arrange
      const singleWord = [{ word: "hello", start: 0, end: 1 }];
      const noWords = [];

      // Act & Assert
      expect(calculateSpeakingRate(singleWord)).toBe(0);
      expect(calculateSpeakingRate(noWords)).toBe(0);
    });
  });

  describe("findPauses", () => {
    test("should find pauses above threshold", () => {
      // Arrange
      const timestamps = [
        { word: "a", start: 0, end: 1 }, // Ends at 1
        { word: "b", start: 1.5, end: 2 }, // Gap: 0.5s (pause)
        { word: "c", start: 2.1, end: 2.5 }, // Gap: 0.1s (no pause)
        { word: "d", start: 3.0, end: 3.5 }, // Gap: 0.5s (pause)
      ];

      // Act
      const pauses = findPauses(timestamps, 0.3);

      // Assert
      expect(pauses).toHaveLength(2);
      expect(pauses[0].duration).toBeCloseTo(0.5, 1);
      expect(pauses[0].start).toBeCloseTo(1, 1);
      expect(pauses[0].end).toBeCloseTo(1.5, 1);
      expect(pauses[1].duration).toBeCloseTo(0.5, 1);
    });

    test("should return empty array for no pauses", () => {
      // Arrange
      const continuousTimestamps = [
        { word: "a", start: 0, end: 1 },
        { word: "b", start: 1, end: 2 },
        { word: "c", start: 2, end: 3 },
      ];

      // Act
      const pauses = findPauses(continuousTimestamps, 0.1);

      // Assert
      expect(pauses).toHaveLength(0);
    });
  });

  describe("smoothTimestamps", () => {
    test("should fix negative durations", () => {
      // Arrange
      const badTimestamps = [
        { word: "a", start: 1, end: 0.5 }, // Negative duration
        { word: "b", start: 2, end: 2 }, // Zero duration
      ];

      // Act
      const smoothed = smoothTimestamps(badTimestamps);

      // Assert
      expect(smoothed[0].end - smoothed[0].start).toBeGreaterThan(0);
      expect(smoothed[1].end - smoothed[1].start).toBeGreaterThan(0);
    });

    test("should fix overlaps", () => {
      // Arrange
      const overlappingTimestamps = [
        { word: "a", start: 0, end: 2 },
        { word: "b", start: 1.5, end: 3 }, // Overlaps with previous
      ];

      // Act
      const smoothed = smoothTimestamps(overlappingTimestamps);

      // Assert
      expect(smoothed[0].end).toBeLessThanOrEqual(smoothed[1].start);
    });

    test("should handle empty array", () => {
      // Act
      const smoothed = smoothTimestamps([]);

      // Assert
      expect(smoothed).toHaveLength(0);
    });
  });

  describe("toSRTFormat", () => {
    test("should convert timestamps to SRT format", () => {
      // Arrange
      const timestamps = [
        { word: "Hello", start: 1.5, end: 2.0 },
        { word: "world", start: 2.0, end: 2.5 },
      ];

      // Act
      const srt = convertWordTimestampsToSrtFormat(timestamps);

      // Assert
      // Check for basic SRT structure rather than exact time formatting
      expect(srt).toContain("1\n");
      expect(srt).toContain("Hello");
      expect(srt).toContain("2\n");
      expect(srt).toContain("world");
    });

    test("should handle empty array", () => {
      // Act
      const srt = convertWordTimestampsToSrtFormat([]);

      // Assert
      expect(srt).toBe("");
    });
  });

  describe("mergeWordTimestamps", () => {
    test("should merge timestamps from multiple segments", () => {
      // Arrange
      const segments = [
        {
          wordTimestamps: [
            { word: "Hello", start: 0, end: 1 },
            { word: "world", start: 1, end: 2 },
          ],
        },
        {
          wordTimestamps: [
            { word: "Goodbye", start: 3, end: 4 },
            { word: "moon", start: 4, end: 5 },
          ],
        },
      ];

      // Act
      const merged = mergeWordTimestamps(segments);

      // Assert
      expect(merged).toHaveLength(4);
      expect(merged.map((ts) => ts.word)).toEqual(["Hello", "world", "Goodbye", "moon"]);
      expect(merged).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ word: "Hello", start: 0 }),
          expect.objectContaining({ word: "moon", start: 4 }),
        ]),
      );
    });

    test("should filter segments without timestamps", () => {
      // Arrange
      const segments = [
        { wordTimestamps: [{ word: "Hello", start: 0, end: 1 }] },
        { wordTimestamps: undefined },
        { wordTimestamps: [] },
        { wordTimestamps: [{ word: "world", start: 1, end: 2 }] },
      ];

      // Act
      const merged = mergeWordTimestamps(segments);

      // Assert
      expect(merged).toHaveLength(2);
      expect(merged.map((ts) => ts.word)).toEqual(["Hello", "world"]);
    });
  });

  describe("exportToJSON", () => {
    test("should export timestamps to JSON format", () => {
      // Arrange
      const timestamps = [{ word: "Test", start: 0, end: 1, confidence: 0.9 }];

      // Act
      const json = exportWordTimestampsToJson(timestamps);
      const parsed = JSON.parse(json);

      // Assert
      expect(parsed.version).toBe("1.0.0");
      expect(parsed.wordCount).toBe(1);
      expect(parsed.timestamps).toHaveLength(1);
      expect(parsed.timestamps[0].word).toBe("Test");
      expect(parsed.generatedAt).toBeDefined();
    });

    test("should handle empty array", () => {
      // Act
      const json = exportWordTimestampsToJson([]);
      const parsed = JSON.parse(json);

      // Assert
      expect(parsed.wordCount).toBe(0);
      expect(parsed.timestamps).toHaveLength(0);
    });
  });
});
