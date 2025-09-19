import { act, renderHook } from '@testing-library/react';
import { useAudioPlayer } from '../../../src/hooks/useAudioPlayer';
import { URLManager } from '../../../src/lib/url-manager';

// Mock dependencies
jest.mock('../../../src/lib/url-manager');

const mockUrlManager = URLManager;

describe('useAudioPlayer hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUrlManager.createObjectURL.mockReturnValue('blob:mock-url');
    mockUrlManager.revokeObjectURL.mockImplementation(jest.fn());
  });

  it('should initialize with default audio player state', () => {
    const { result } = renderHook(() => useAudioPlayer());

    expect(result.current.audioPlayerState).toEqual({
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      isMuted: false,
    });

    expect(result.current.audioUrl).toBeUndefined();
    expect(result.current.loopStart).toBeUndefined();
    expect(result.current.loopEnd).toBeUndefined();
  });

  it('should provide all expected functions', () => {
    const { result } = renderHook(() => useAudioPlayer());

    expect(typeof result.current.setAudioFile).toBe('function');
    expect(typeof result.current.setLoopPoints).toBe('function');
    expect(typeof result.current.updatePlayerState).toBe('function');
    expect(typeof result.current.handleSeek).toBe('function');
    expect(typeof result.current.clearAudio).toBe('function');
  });

  describe('setAudioFile', () => {
    it('should set audio file and create URL', () => {
      const { result } = renderHook(() => useAudioPlayer());
      const mockFile = new File(['audio'], 'test.mp3', { type: 'audio/mp3' });

      act(() => {
        result.current.setAudioFile(mockFile);
      });

      expect(mockUrlManager.createObjectURL).toHaveBeenCalledWith(mockFile);
      expect(result.current.audioUrl).toBe('blob:mock-url');
    });

    it('should reset player state when setting new audio', () => {
      const { result } = renderHook(() => useAudioPlayer());
      const mockFile = new File(['audio'], 'test.mp3', { type: 'audio/mp3' });

      // First update the state
      act(() => {
        result.current.updatePlayerState({
          isPlaying: true,
          currentTime: 50,
          duration: 100,
          volume: 0.5,
        });
      });

      // Then set audio file
      act(() => {
        result.current.setAudioFile(mockFile);
      });

      expect(result.current.audioPlayerState).toEqual({
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 1,
        isMuted: false,
      });
    });

    it('should revoke previous URL when setting new audio', () => {
      const { result } = renderHook(() => useAudioPlayer());
      const mockFile1 = new File(['audio1'], 'test1.mp3', {
        type: 'audio/mp3',
      });
      const mockFile2 = new File(['audio2'], 'test2.mp3', {
        type: 'audio/mp3',
      });

      mockUrlManager.createObjectURL
        .mockReturnValueOnce('blob:url1')
        .mockReturnValueOnce('blob:url2');

      act(() => {
        result.current.setAudioFile(mockFile1);
      });

      act(() => {
        result.current.setAudioFile(mockFile2);
      });

      expect(mockUrlManager.revokeObjectURL).toHaveBeenCalledWith('blob:url1');
      expect(result.current.audioUrl).toBe('blob:url2');
    });
  });

  describe('updatePlayerState', () => {
    it('should update player state partially', () => {
      const { result } = renderHook(() => useAudioPlayer());

      act(() => {
        result.current.updatePlayerState({
          isPlaying: true,
          currentTime: 30,
        });
      });

      expect(result.current.audioPlayerState).toEqual({
        isPlaying: true,
        currentTime: 30,
        duration: 0,
        volume: 1,
        isMuted: false,
      });
    });

    it('should update multiple state properties', () => {
      const { result } = renderHook(() => useAudioPlayer());

      act(() => {
        result.current.updatePlayerState({
          isPlaying: true,
          duration: 120,
          volume: 0.8,
          isMuted: true,
        });
      });

      expect(result.current.audioPlayerState).toEqual({
        isPlaying: true,
        currentTime: 0,
        duration: 120,
        volume: 0.8,
        isMuted: true,
      });
    });
  });

  describe('handleSeek', () => {
    it('should update current time', () => {
      const { result } = renderHook(() => useAudioPlayer());

      act(() => {
        result.current.handleSeek(45);
      });

      expect(result.current.audioPlayerState.currentTime).toBe(45);
      expect(result.current.audioPlayerState.isPlaying).toBe(false); // Other properties unchanged
    });
  });

  describe('setLoopPoints', () => {
    it('should set loop start and end points', () => {
      const { result } = renderHook(() => useAudioPlayer());

      act(() => {
        result.current.setLoopPoints(10, 30);
      });

      expect(result.current.loopStart).toBe(10);
      expect(result.current.loopEnd).toBe(30);
    });

    it('should set only start point', () => {
      const { result } = renderHook(() => useAudioPlayer());

      act(() => {
        result.current.setLoopPoints(15);
      });

      expect(result.current.loopStart).toBe(15);
      expect(result.current.loopEnd).toBeUndefined();
    });

    it('should clear loop points when called with undefined', () => {
      const { result } = renderHook(() => useAudioPlayer());

      // First set loop points
      act(() => {
        result.current.setLoopPoints(10, 30);
      });

      // Then clear them
      act(() => {
        result.current.setLoopPoints();
      });

      expect(result.current.loopStart).toBeUndefined();
      expect(result.current.loopEnd).toBeUndefined();
    });
  });

  describe('clearAudio', () => {
    it('should clear all audio-related state', () => {
      const { result } = renderHook(() => useAudioPlayer());
      const mockFile = new File(['audio'], 'test.mp3', { type: 'audio/mp3' });

      // Set up audio and loop points
      act(() => {
        result.current.setAudioFile(mockFile);
        result.current.setLoopPoints(10, 30);
        result.current.updatePlayerState({
          isPlaying: true,
          currentTime: 20,
          duration: 60,
        });
      });

      // Clear audio
      act(() => {
        result.current.clearAudio();
      });

      expect(mockUrlManager.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      expect(result.current.audioUrl).toBeUndefined();
      expect(result.current.loopStart).toBeUndefined();
      expect(result.current.loopEnd).toBeUndefined();
      expect(result.current.audioPlayerState).toEqual({
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 1,
        isMuted: false,
      });
    });

    it('should handle clearing when no audio is set', () => {
      const { result } = renderHook(() => useAudioPlayer());

      act(() => {
        result.current.clearAudio();
      });

      expect(mockUrlManager.revokeObjectURL).not.toHaveBeenCalled();
      expect(result.current.audioUrl).toBeUndefined();
    });
  });

  describe('loop functionality', () => {
    it('should seek to loop start when current time reaches loop end', () => {
      const { result, rerender } = renderHook(() => useAudioPlayer());

      // Set up loop points
      act(() => {
        result.current.setLoopPoints(10, 30);
        result.current.updatePlayerState({
          isPlaying: true,
          currentTime: 25,
        });
      });

      // Simulate time reaching loop end
      act(() => {
        result.current.updatePlayerState({
          currentTime: 30,
        });
      });

      rerender();

      // Should seek back to loop start
      expect(result.current.audioPlayerState.currentTime).toBe(10);
    });

    it('should not loop when not playing', () => {
      const { result, rerender } = renderHook(() => useAudioPlayer());

      act(() => {
        result.current.setLoopPoints(10, 30);
        result.current.updatePlayerState({
          isPlaying: false,
          currentTime: 30,
        });
      });

      rerender();

      // Should not seek back when not playing
      expect(result.current.audioPlayerState.currentTime).toBe(30);
    });

    it('should not loop when loop points are not set', () => {
      const { result, rerender } = renderHook(() => useAudioPlayer());

      act(() => {
        result.current.updatePlayerState({
          isPlaying: true,
          currentTime: 60,
        });
      });

      rerender();

      // Should not change time when no loop points
      expect(result.current.audioPlayerState.currentTime).toBe(60);
    });
  });

  describe('cleanup', () => {
    it('should revoke URL on unmount', () => {
      const { result, unmount } = renderHook(() => useAudioPlayer());
      const mockFile = new File(['audio'], 'test.mp3', { type: 'audio/mp3' });

      act(() => {
        result.current.setAudioFile(mockFile);
      });

      unmount();

      expect(mockUrlManager.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should not try to revoke URL if none exists on unmount', () => {
      const { unmount } = renderHook(() => useAudioPlayer());

      unmount();

      expect(mockUrlManager.revokeObjectURL).not.toHaveBeenCalled();
    });
  });
});
