import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLongPress } from "@/hooks/useLongPress.js";

function touchEvent(touches = [{ clientX: 0, clientY: 0 }]) {
  return { touches };
}

describe("useLongPress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires callback after default 500ms hold", () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress(onLongPress));

    act(() => result.current.onTouchStart(touchEvent()));
    expect(onLongPress).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(500));
    expect(onLongPress).toHaveBeenCalledOnce();
  });

  it("respects custom delay", () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() =>
      useLongPress(onLongPress, { delay: 1000 }),
    );

    act(() => result.current.onTouchStart(touchEvent()));
    act(() => vi.advanceTimersByTime(500));
    expect(onLongPress).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(500));
    expect(onLongPress).toHaveBeenCalledOnce();
  });

  it("does not fire if touch ends before delay", () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress(onLongPress));

    act(() => result.current.onTouchStart(touchEvent()));
    act(() => vi.advanceTimersByTime(300));
    act(() => result.current.onTouchEnd());
    act(() => vi.advanceTimersByTime(500));

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("does not fire if touch is cancelled", () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress(onLongPress));

    act(() => result.current.onTouchStart(touchEvent()));
    act(() => result.current.onTouchCancel());
    act(() => vi.advanceTimersByTime(500));

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("cancels when finger moves beyond tolerance (scroll)", () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress(onLongPress));

    act(() =>
      result.current.onTouchStart(touchEvent([{ clientX: 0, clientY: 0 }])),
    );
    act(() =>
      result.current.onTouchMove(touchEvent([{ clientX: 0, clientY: 50 }])),
    );
    act(() => vi.advanceTimersByTime(500));

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("does not cancel for small finger jitter", () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress(onLongPress));

    act(() =>
      result.current.onTouchStart(touchEvent([{ clientX: 0, clientY: 0 }])),
    );
    act(() =>
      result.current.onTouchMove(touchEvent([{ clientX: 3, clientY: 4 }])),
    );
    act(() => vi.advanceTimersByTime(500));

    expect(onLongPress).toHaveBeenCalledOnce();
  });

  it("uses latest callback after re-render", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(({ cb }) => useLongPress(cb), {
      initialProps: { cb: first },
    });

    act(() => result.current.onTouchStart(touchEvent()));
    rerender({ cb: second });
    act(() => vi.advanceTimersByTime(500));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });
});
