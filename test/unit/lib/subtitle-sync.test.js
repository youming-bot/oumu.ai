import { SubtitleSynchronizer, ABLoopManager, formatTime, parseTime } from '../../../src/lib/subtitle-sync';

// Mock Segment data for testing
const createMockSegment = (id, start, end, text, options = {}) => ({
  id,
  start,
  end,
  text,
  normalizedText: options.normalizedText || text.toLowerCase(),
  translation: options.translation || `${text} translation`,
  annotations: options.annotations || [],
  furigana: options.furigana,
  wordTimestamps: options.wordTimestamps
});

describe('Subtitle Synchronization', () => {
  describe('SubtitleSynchronizer', () => {
    test('should initialize with segments and create subtitles', () => {
      // Arrange
      const segments = [
        createMockSegment(1, 0, 5, 'Hello world'),
        createMockSegment(2, 5, 10, 'How are you?'),
        createMockSegment(3, 10, 15, 'Goodbye')
      ];

      // Act
      const synchronizer = new SubtitleSynchronizer(segments);

      // Assert
      expect(synchronizer.getSubtitleCount()).toBe(3);
      expect(synchronizer.getDuration()).toBe(15);
    });

    test('should filter invalid segments during initialization', () => {
      // Arrange
      const segments = [
        createMockSegment(1, 0, 5, 'Valid segment'),
        { id: 2, start: undefined, end: 10, text: 'Invalid start' }, // Invalid start
        { id: 3, start: 10, end: undefined, text: 'Invalid end' },   // Invalid end
        { id: 4, start: 15, end: 20, text: '' },                    // Empty text
        createMockSegment(5, 20, 25, 'Another valid segment')
      ];

      // Act
      const synchronizer = new SubtitleSynchronizer(segments);

      // Assert
      expect(synchronizer.getSubtitleCount()).toBe(2);
      expect(synchronizer.getDuration()).toBe(25);
    });

    test('should find active subtitles with time preload/postload', () => {
      // Arrange
      const segments = [
        createMockSegment(1, 0, 5, 'Segment 1'),
        createMockSegment(2, 5, 10, 'Segment 2'),
        createMockSegment(3, 10, 15, 'Segment 3')
      ];

      const synchronizer = new SubtitleSynchronizer(segments, {
        preloadTime: 1.0,
        postloadTime: 0.5
      });

      // Act & Assert
      synchronizer.updateTime(-0.5); // Before first segment with preload
      let state = synchronizer.getCurrentState();
      expect(state.currentSubtitle).toBeNull();

      synchronizer.updateTime(0); // Start of first segment
      state = synchronizer.getCurrentState();
      expect(state.currentSubtitle?.text).toBe('Segment 1');

      synchronizer.updateTime(4.9); // End of first segment
      state = synchronizer.getCurrentState();
      expect(state.currentSubtitle?.text).toBe('Segment 1');

      synchronizer.updateTime(5.4); // Within postload time of first segment
      state = synchronizer.getCurrentState();
      expect(state.currentSubtitle?.text).toBe('Segment 2');

      synchronizer.updateTime(15.5); // After last segment with postload
      state = synchronizer.getCurrentState();
      expect(state.currentSubtitle).toBeNull();
    });

    test('should get current state with upcoming and previous subtitles', () => {
      // Arrange
      const segments = [
        createMockSegment(1, 0, 5, 'Segment 1'),
        createMockSegment(2, 5, 10, 'Segment 2'),
        createMockSegment(3, 10, 15, 'Segment 3'),
        createMockSegment(4, 15, 20, 'Segment 4'),
        createMockSegment(5, 20, 25, 'Segment 5'),
        createMockSegment(6, 25, 30, 'Segment 6')
      ];

      const synchronizer = new SubtitleSynchronizer(segments, {
        maxSubtitles: 2
      });

      // Act
      synchronizer.updateTime(12);
      const state = synchronizer.getCurrentState();

      // Assert
      expect(state.currentSubtitle?.text).toBe('Segment 3');
      expect(state.upcomingSubtitles).toHaveLength(2);
      expect(state.upcomingSubtitles[0].text).toBe('Segment 4');
      expect(state.upcomingSubtitles[1].text).toBe('Segment 5');
      expect(state.previousSubtitles).toHaveLength(2);
      expect(state.previousSubtitles[0].text).toBe('Segment 1');
      expect(state.previousSubtitles[1].text).toBe('Segment 2');
    });

    test('should seek to subtitle and return start time', () => {
      // Arrange
      const segments = [
        createMockSegment(1, 0, 5, 'Segment 1'),
        createMockSegment(2, 5, 10, 'Segment 2'),
        createMockSegment(3, 10, 15, 'Segment 3')
      ];

      const synchronizer = new SubtitleSynchronizer(segments);

      // Act & Assert
      const seekTime = synchronizer.seekToSubtitle(2);
      expect(seekTime).toBe(5);

      const invalidSeek = synchronizer.seekToSubtitle(999);
      expect(invalidSeek).toBeNull();
    });

    test('should find subtitle at specific time', () => {
      // Arrange
      const segments = [
        createMockSegment(1, 0, 5, 'Segment 1'),
        createMockSegment(2, 5, 10, 'Segment 2'),
        createMockSegment(3, 10, 15, 'Segment 3')
      ];

      const synchronizer = new SubtitleSynchronizer(segments);

      // Act & Assert
      const subtitleAt2 = synchronizer.findSubtitleAtTime(2);
      expect(subtitleAt2?.text).toBe('Segment 1');

      const subtitleAt7 = synchronizer.findSubtitleAtTime(7);
      expect(subtitleAt7?.text).toBe('Segment 2');

      const subtitleAt12 = synchronizer.findSubtitleAtTime(12);
      expect(subtitleAt12?.text).toBe('Segment 3');

      const subtitleAt20 = synchronizer.findSubtitleAtTime(20);
      expect(subtitleAt20).toBeNull();
    });

    test('should find nearest subtitle to time', () => {
      // Arrange
      const segments = [
        createMockSegment(1, 0, 5, 'Segment 1'),
        createMockSegment(2, 5, 10, 'Segment 2'),
        createMockSegment(3, 10, 15, 'Segment 3')
      ];

      const synchronizer = new SubtitleSynchronizer(segments);

      // Act & Assert
      const nearestTo2 = synchronizer.findNearestSubtitle(2); // Middle of segment 1 is 2.5
      expect(nearestTo2?.text).toBe('Segment 1');

      const nearestTo6 = synchronizer.findNearestSubtitle(6); // Middle of segment 2 is 7.5
      expect(nearestTo6?.text).toBe('Segment 2');

      const nearestTo13 = synchronizer.findNearestSubtitle(13); // Middle of segment 3 is 12.5
      expect(nearestTo13?.text).toBe('Segment 3');

      const nearestTo100 = synchronizer.findNearestSubtitle(100); // Far beyond
      expect(nearestTo100?.text).toBe('Segment 3');
    });

    test('should get subtitle text at time', () => {
      // Arrange
      const segments = [
        createMockSegment(1, 0, 5, 'Hello'),
        createMockSegment(2, 5, 10, 'World')
      ];

      const synchronizer = new SubtitleSynchronizer(segments);

      // Act & Assert
      expect(synchronizer.getSubtitleTextAtTime(2)).toBe('Hello');
      expect(synchronizer.getSubtitleTextAtTime(7)).toBe('World');
      expect(synchronizer.getSubtitleTextAtTime(12)).toBe('');
    });

    test('should get subtitles in time range', () => {
      // Arrange
      const segments = [
        createMockSegment(1, 0, 5, 'Segment 1'),
        createMockSegment(2, 5, 10, 'Segment 2'),
        createMockSegment(3, 10, 15, 'Segment 3'),
        createMockSegment(4, 15, 20, 'Segment 4')
      ];

      const synchronizer = new SubtitleSynchronizer(segments);

      // Act
      const range1 = synchronizer.getSubtitlesInRange(3, 8);
      const range2 = synchronizer.getSubtitlesInRange(12, 18);
      const range3 = synchronizer.getSubtitlesInRange(25, 30);

      // Assert
      expect(range1).toHaveLength(2);
      expect(range1[0].text).toBe('Segment 1');
      expect(range1[1].text).toBe('Segment 2');

      expect(range2).toHaveLength(2);
      expect(range2[0].text).toBe('Segment 3');
      expect(range2[1].text).toBe('Segment 4');

      expect(range3).toHaveLength(0);
    });

    test('should notify update callback when time changes', () => {
      // Arrange
      const segments = [createMockSegment(1, 0, 5, 'Test')];
      const synchronizer = new SubtitleSynchronizer(segments);

      const mockCallback = jest.fn();
      synchronizer.onUpdate(mockCallback);

      // Act
      synchronizer.updateTime(2);

      // Assert
      expect(mockCallback).toHaveBeenCalledTimes(1);
      const callbackArg = mockCallback.mock.calls[0][0];
      expect(callbackArg.currentSubtitle?.text).toBe('Test');
    });

    test('should handle empty segments array', () => {
      // Arrange
      const synchronizer = new SubtitleSynchronizer([]);

      // Act & Assert
      expect(synchronizer.getSubtitleCount()).toBe(0);
      expect(synchronizer.getDuration()).toBe(0);
      expect(synchronizer.findSubtitleAtTime(5)).toBeNull();
      expect(synchronizer.getCurrentState().currentSubtitle).toBeNull();
    });
  });

  describe('ABLoopManager', () => {
    test('should set and clear loop range', () => {
      // Arrange
      const loopManager = new ABLoopManager();

      // Act
      loopManager.setLoop(10, 20);

      // Assert
      expect(loopManager.isActive()).toBe(true);
      expect(loopManager.getLoopRange()).toEqual({ start: 10, end: 20 });

      // Act - Clear
      loopManager.clearLoop();

      // Assert
      expect(loopManager.isActive()).toBe(false);
      expect(loopManager.getLoopRange()).toEqual({ start: 0, end: 0 });
    });

    test('should detect when current time reaches loop end', () => {
      // Arrange
      const loopManager = new ABLoopManager();
      loopManager.setLoop(5, 15);

      const mockCallback = jest.fn();
      loopManager.onLoop(mockCallback);

      // Act & Assert
      expect(loopManager.checkLoop(14.9)).toBe(false);
      expect(loopManager.checkLoop(15)).toBe(true);
      expect(loopManager.checkLoop(15.1)).toBe(true);
      expect(mockCallback).toHaveBeenCalledWith(5);
    });

    test('should not loop when inactive or invalid range', () => {
      // Arrange
      const loopManager = new ABLoopManager();

      // Act & Assert - Inactive
      expect(loopManager.checkLoop(100)).toBe(false);

      // Act & Assert - Invalid range
      loopManager.setLoop(20, 10); // end < start
      expect(loopManager.checkLoop(15)).toBe(false);
    });
  });

  describe('Time Formatting Utilities', () => {
    test('should format time correctly', () => {
      // Act & Assert
      expect(formatTime(0)).toBe('00:00.00');
      expect(formatTime(65.5)).toBe('01:05.50');
      expect(formatTime(3661.75)).toBe('61:01.75');
      expect(formatTime(123.456)).toBe('02:03.45'); // Rounds down
    });

    test('should parse time strings correctly', () => {
      // Act & Assert
      expect(parseTime('00:00.00')).toBe(0);
      expect(parseTime('01:05.50')).toBeCloseTo(65.5, 2);
      expect(parseTime('61:01.75')).toBeCloseTo(3661.75, 2);
      expect(parseTime('2:03.45')).toBeCloseTo(123.45, 2);
      expect(parseTime('1:2:3.45')).toBeCloseTo(3723.45, 2); // 1h 2m 3.45s
      expect(parseTime('123.456')).toBeCloseTo(123.456, 2);
    });

    test('should handle edge cases in time parsing', () => {
      // Act & Assert
      expect(parseTime('')).toBeNaN();
      expect(parseTime('invalid')).toBeNaN();
      expect(parseTime('1:')).toBeNaN(); // Invalid format
      expect(parseTime(':30')).toBeNaN(); // Invalid format
    });
  });
});