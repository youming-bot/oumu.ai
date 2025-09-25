import { act, renderHook } from "@testing-library/react";
import { useAudioPlayer } from "../../../src/hooks/useAudioPlayer";

describe("useAudioPlayer hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with default audio player state", () => {
    const { result } = renderHook(() => useAudioPlayer());

    expect(result.current.audioPlayerState).toEqual({
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      isMuted: false,
    });

    expect(result.current.loopStart).toBeUndefined();
    expect(result.current.loopEnd).toBeUndefined();
    expect(result.current.currentFile).toBeNull();
    expect(result.current.playbackRate).toBe(1);
  });

  it("should provide all expected functions", () => {
    const { result } = renderHook(() => useAudioPlayer());

    expect(typeof result.current.setCurrentFile).toBe("function");
    expect(typeof result.current.setLoopPoints).toBe("function");
    expect(typeof result.current.updatePlayerState).toBe("function");
    expect(typeof result.current.handleSeek).toBe("function");
    expect(typeof result.current.clearAudio).toBe("function");
    expect(typeof result.current.setPlaybackRate).toBe("function");
    expect(typeof result.current.playbackRate).toBe("number");
  });

  describe("setCurrentFile", () => {
    it("should set current file", () => {
      const { result } = renderHook(() => useAudioPlayer());
      const mockFile = {
        id: 1,
        name: "test.mp3",
        size: 1024,
        type: "audio/mp3",
        blob: new Blob(["audio"], { type: "audio/mp3" }),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      act(() => {
        result.current.setCurrentFile(mockFile);
      });

      expect(result.current.currentFile).toEqual(mockFile);
    });

    it("should set current file to null", () => {
      const { result } = renderHook(() => useAudioPlayer());

      act(() => {
        result.current.setCurrentFile(null);
      });

      expect(result.current.currentFile).toBeNull();
    });
  });

  describe("updatePlayerState", () => {
    it("should update player state partially", () => {
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

    it("should update multiple state properties", () => {
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

  describe("handleSeek", () => {
    it("should update current time", () => {
      const { result } = renderHook(() => useAudioPlayer());

      act(() => {
        result.current.handleSeek(45);
      });

      expect(result.current.audioPlayerState.currentTime).toBe(45);
      expect(result.current.audioPlayerState.isPlaying).toBe(false); // Other properties unchanged
    });
  });

  describe("setLoopPoints", () => {
    it("should set loop start and end points", () => {
      const { result } = renderHook(() => useAudioPlayer());

      act(() => {
        result.current.setLoopPoints(10, 30);
      });

      expect(result.current.loopStart).toBe(10);
      expect(result.current.loopEnd).toBe(30);
    });

    it("should set only start point", () => {
      const { result } = renderHook(() => useAudioPlayer());

      act(() => {
        result.current.setLoopPoints(15);
      });

      expect(result.current.loopStart).toBe(15);
      expect(result.current.loopEnd).toBeUndefined();
    });

    it("should clear loop points when called with undefined", () => {
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

  describe("clearAudio", () => {
    it("should clear all audio-related state", () => {
      const { result } = renderHook(() => useAudioPlayer());
      const mockFile = {
        id: 1,
        name: "test.mp3",
        size: 1024,
        type: "audio/mp3",
        blob: new Blob(["audio"], { type: "audio/mp3" }),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Set up audio and loop points
      act(() => {
        result.current.setCurrentFile(mockFile);
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

      expect(result.current.currentFile).toBeNull();
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
  });

  describe("loop functionality", () => {
    it("should seek to loop start when current time reaches loop end", () => {
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

    it("should not loop when not playing", () => {
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

    it("should not loop when loop points are not set", () => {
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

  describe("playbackRate functionality", () => {
    it("should initialize with default playback rate of 1", () => {
      const { result } = renderHook(() => useAudioPlayer());

      expect(result.current.playbackRate).toBe(1);
    });

    it("should set playback rate", () => {
      const { result } = renderHook(() => useAudioPlayer());

      act(() => {
        result.current.setPlaybackRate(1.5);
      });

      expect(result.current.playbackRate).toBe(1.5);
    });

    it("should set playback rate to 0.5", () => {
      const { result } = renderHook(() => useAudioPlayer());

      act(() => {
        result.current.setPlaybackRate(0.5);
      });

      expect(result.current.playbackRate).toBe(0.5);
    });

    it("should set playback rate to 2", () => {
      const { result } = renderHook(() => useAudioPlayer());

      act(() => {
        result.current.setPlaybackRate(2);
      });

      expect(result.current.playbackRate).toBe(2);
    });

    it("should handle decimal playback rates", () => {
      const { result } = renderHook(() => useAudioPlayer());

      act(() => {
        result.current.setPlaybackRate(1.25);
      });

      expect(result.current.playbackRate).toBe(1.25);
    });

    it("should handle very small playback rates", () => {
      const { result } = renderHook(() => useAudioPlayer());

      act(() => {
        result.current.setPlaybackRate(0.25);
      });

      expect(result.current.playbackRate).toBe(0.25);
    });

    it("should handle zero playback rate", () => {
      const { result } = renderHook(() => useAudioPlayer());

      act(() => {
        result.current.setPlaybackRate(0);
      });

      expect(result.current.playbackRate).toBe(0);
    });

    it("should handle negative playback rates", () => {
      const { result } = renderHook(() => useAudioPlayer());

      act(() => {
        result.current.setPlaybackRate(-1);
      });

      expect(result.current.playbackRate).toBe(-1);
    });

    it("should maintain playback rate when other states change", () => {
      const { result } = renderHook(() => useAudioPlayer());

      // 设置播放速率
      act(() => {
        result.current.setPlaybackRate(1.5);
      });

      // 更新其他状态
      act(() => {
        result.current.updatePlayerState({
          isPlaying: true,
          currentTime: 30,
        });
      });

      // 播放速率应该保持不变
      expect(result.current.playbackRate).toBe(1.5);
    });

    it("should maintain playback rate when clearing audio", () => {
      const { result } = renderHook(() => useAudioPlayer());
      const mockFile = {
        id: 1,
        name: "test.mp3",
        size: 1024,
        type: "audio/mp3",
        blob: new Blob(["audio"], { type: "audio/mp3" }),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 设置播放速率和其他状态
      act(() => {
        result.current.setPlaybackRate(0.75);
        result.current.setCurrentFile(mockFile);
        result.current.setLoopPoints(10, 30);
      });

      // 清除音频 - 注意 clearAudio 不会重置 playbackRate
      act(() => {
        result.current.clearAudio();
      });

      // 播放速率应该保持不变（clearAudio 不重置 playbackRate）
      expect(result.current.playbackRate).toBe(0.75);
    });

    it("should allow changing playback rate multiple times", () => {
      const { result } = renderHook(() => useAudioPlayer());

      // 连续更改播放速率
      act(() => {
        result.current.setPlaybackRate(1.5);
      });
      expect(result.current.playbackRate).toBe(1.5);

      act(() => {
        result.current.setPlaybackRate(0.5);
      });
      expect(result.current.playbackRate).toBe(0.5);

      act(() => {
        result.current.setPlaybackRate(2);
      });
      expect(result.current.playbackRate).toBe(2);

      act(() => {
        result.current.setPlaybackRate(1);
      });
      expect(result.current.playbackRate).toBe(1);
    });

    it("should not affect other state properties when changing playback rate", () => {
      const { result } = renderHook(() => useAudioPlayer());

      // 设置初始状态
      act(() => {
        result.current.updatePlayerState({
          isPlaying: true,
          currentTime: 45,
          duration: 120,
          volume: 0.8,
        });
      });

      const originalState = result.current.audioPlayerState;

      // 更改播放速率
      act(() => {
        result.current.setPlaybackRate(1.25);
      });

      // 其他状态应该保持不变
      expect(result.current.audioPlayerState).toEqual(originalState);
      expect(result.current.playbackRate).toBe(1.25);
    });

    it("should handle very large playback rates", () => {
      const { result } = renderHook(() => useAudioPlayer());

      act(() => {
        result.current.setPlaybackRate(100);
      });

      expect(result.current.playbackRate).toBe(100);
    });

    it("should handle very small positive playback rates", () => {
      const { result } = renderHook(() => useAudioPlayer());

      act(() => {
        result.current.setPlaybackRate(0.1);
      });

      expect(result.current.playbackRate).toBe(0.1);
    });
  });

  describe("control functions", () => {
    it("should provide onPlay function", () => {
      const { result } = renderHook(() => useAudioPlayer());

      act(() => {
        result.current.onPlay();
      });

      expect(result.current.audioPlayerState.isPlaying).toBe(true);
    });

    it("should provide onPause function", () => {
      const { result } = renderHook(() => useAudioPlayer());

      // 先设置为播放状态
      act(() => {
        result.current.updatePlayerState({ isPlaying: true });
      });

      act(() => {
        result.current.onPause();
      });

      expect(result.current.audioPlayerState.isPlaying).toBe(false);
    });

    it("should provide onSkipBack function", () => {
      const { result } = renderHook(() => useAudioPlayer());

      // 设置当前时间
      act(() => {
        result.current.updatePlayerState({ currentTime: 30, duration: 60 });
      });

      act(() => {
        result.current.onSkipBack();
      });

      expect(result.current.audioPlayerState.currentTime).toBe(20); // 30 - 10 = 20
    });

    it("should provide onSkipForward function", () => {
      const { result } = renderHook(() => useAudioPlayer());

      // 设置当前时间和时长
      act(() => {
        result.current.updatePlayerState({ currentTime: 30, duration: 60 });
      });

      act(() => {
        result.current.onSkipForward();
      });

      expect(result.current.audioPlayerState.currentTime).toBe(40); // 30 + 10 = 40
    });

    it("should handle skip back at boundary", () => {
      const { result } = renderHook(() => useAudioPlayer());

      // 设置当前时间为5秒
      act(() => {
        result.current.updatePlayerState({ currentTime: 5, duration: 60 });
      });

      act(() => {
        result.current.onSkipBack();
      });

      expect(result.current.audioPlayerState.currentTime).toBe(0); // 不能小于0
    });

    it("should handle skip forward at boundary", () => {
      const { result } = renderHook(() => useAudioPlayer());

      // 设置当前时间为55秒，时长为60秒
      act(() => {
        result.current.updatePlayerState({ currentTime: 55, duration: 60 });
      });

      act(() => {
        result.current.onSkipForward();
      });

      expect(result.current.audioPlayerState.currentTime).toBe(60); // 不能超过duration
    });

    it("should provide onSetLoop function", () => {
      const { result } = renderHook(() => useAudioPlayer());

      act(() => {
        result.current.onSetLoop(10, 30);
      });

      expect(result.current.loopStart).toBe(10);
      expect(result.current.loopEnd).toBe(30);
    });

    it("should provide onClearLoop function", () => {
      const { result } = renderHook(() => useAudioPlayer());

      // 先设置循环点
      act(() => {
        result.current.setLoopPoints(10, 30);
      });

      act(() => {
        result.current.onClearLoop();
      });

      expect(result.current.loopStart).toBeUndefined();
      expect(result.current.loopEnd).toBeUndefined();
    });
  });

  // Note: cleanup tests removed since useAudioPlayer no longer manages URLs
});
