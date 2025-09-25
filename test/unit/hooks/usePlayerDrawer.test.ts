import { act, renderHook } from "@testing-library/react";
import { usePlayerDrawer } from "@/hooks/usePlayerDrawer";

describe("usePlayerDrawer", () => {
  it("应该正确处理音量和静音状态", () => {
    const { result } = renderHook(() => usePlayerDrawer());

    // 初始状态
    expect(result.current.state.volume).toBe(1);
    expect(result.current.state.displayVolume).toBe(1);
    expect(result.current.state.isMuted).toBe(false);

    // 切换静音
    act(() => {
      result.current.actions.toggleMute();
    });

    // 切换后应该静音且音量为0
    expect(result.current.state.isMuted).toBe(true);
    expect(result.current.state.volume).toBe(0);
    expect(result.current.state.displayVolume).toBe(0);

    // 再次切换静音
    act(() => {
      result.current.actions.toggleMute();
    });

    // 恢复后应该不静音且音量恢复为1
    expect(result.current.state.isMuted).toBe(false);
    expect(result.current.state.volume).toBe(1);
    expect(result.current.state.displayVolume).toBe(1);
  });

  it("应该正确处理音量设置", () => {
    const { result } = renderHook(() => usePlayerDrawer());

    // 设置音量为0.5
    act(() => {
      result.current.actions.setVolume(0.5);
    });

    expect(result.current.state.volume).toBe(0.5);
    expect(result.current.state.displayVolume).toBe(0.5);
    expect(result.current.state.isMuted).toBe(false);

    // 设置音量为0应该自动静音
    act(() => {
      result.current.actions.setVolume(0);
    });

    expect(result.current.state.volume).toBe(0);
    expect(result.current.state.displayVolume).toBe(0);
    expect(result.current.state.isMuted).toBe(true);

    // 设置音量大于0不会自动取消静音（保持静音状态）
    act(() => {
      result.current.actions.setVolume(0.3);
    });

    expect(result.current.state.volume).toBe(0.3);
    expect(result.current.state.displayVolume).toBe(0); // 静音状态显示为0
    expect(result.current.state.isMuted).toBe(true); // 保持静音状态
  });

  it("应该不会导致无限循环", () => {
    const { result } = renderHook(() => usePlayerDrawer());

    // 这个测试主要确保没有无限循环错误
    // 如果有无限循环，这个测试会因为超时而失败

    // 测试音量变化
    act(() => {
      result.current.actions.setVolume(0.5);
    });

    // 测试静音切换
    act(() => {
      result.current.actions.toggleMute();
    });

    // 再次测试音量变化（此时应该是静音状态）
    act(() => {
      result.current.actions.setVolume(0.8);
    });

    // 验证最终状态
    expect(result.current.state.volume).toBe(0.8);
    expect(result.current.state.displayVolume).toBe(0); // 静音状态显示为0
    expect(result.current.state.isMuted).toBe(true); // 保持静音状态
  });
});
