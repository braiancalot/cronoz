import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useNarrowViewport,
  useSliverViewport,
} from "@/hooks/useNarrowViewport.js";

function makeFakeViewport(width) {
  const listeners = new Map();
  const viewport = {
    width,
    matchMedia: vi.fn((query) => {
      const maxWidth = Number(query.match(/\d+/)[0]);
      const matches = () => viewport.width <= maxWidth;
      return {
        get matches() {
          return matches();
        },
        addEventListener: (type, listener) => listeners.set(listener, matches),
        removeEventListener: (type, listener) => listeners.delete(listener),
      };
    }),
    resize(nextWidth) {
      viewport.width = nextWidth;
      listeners.forEach((matches, listener) =>
        listener({ matches: matches() }),
      );
    },
    listenerCount: () => listeners.size,
  };
  return viewport;
}

describe("useNarrowViewport", () => {
  let viewport;

  beforeEach(() => {
    viewport = makeFakeViewport(1024);
    vi.stubGlobal("matchMedia", viewport.matchMedia);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads the viewport on the first render", () => {
    viewport.width = 400;
    const { result } = renderHook(() => useNarrowViewport());

    expect(result.current).toBe(true);
  });

  it("follows the viewport across the breakpoint", () => {
    const { result } = renderHook(() => useNarrowViewport());
    expect(result.current).toBe(false);

    act(() => viewport.resize(480));
    expect(result.current).toBe(true);

    act(() => viewport.resize(481));
    expect(result.current).toBe(false);
  });

  it("stops listening on unmount", () => {
    const { unmount } = renderHook(() => useNarrowViewport());

    unmount();

    expect(viewport.listenerCount()).toBe(0);
  });

  it("uses a narrower breakpoint for the sliver", () => {
    viewport.width = 400;
    const { result } = renderHook(() => useSliverViewport());

    expect(result.current).toBe(false);
  });
});
