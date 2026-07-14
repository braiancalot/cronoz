import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useShortViewport } from "@/hooks/useShortViewport.js";

function mockMatchMedia(initial) {
  let handler;
  const mql = {
    matches: initial,
    addEventListener: (_event, h) => {
      handler = h;
    },
    removeEventListener: () => {
      handler = undefined;
    },
  };
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(mql));
  return {
    setMatches(value) {
      mql.matches = value;
      act(() => handler?.({ matches: value }));
    },
  };
}

describe("useShortViewport", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns false when the viewport is tall", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useShortViewport());
    expect(result.current).toBe(false);
  });

  it("returns true when the viewport is short", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useShortViewport());
    expect(result.current).toBe(true);
  });

  it("updates when the media query changes", () => {
    const mm = mockMatchMedia(false);
    const { result } = renderHook(() => useShortViewport());
    expect(result.current).toBe(false);
    mm.setMatches(true);
    expect(result.current).toBe(true);
  });
});
