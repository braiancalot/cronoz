import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { pickPiPSize, usePiPSize } from "@/hooks/usePiPSize.js";

function makeFakeWindow(width, height) {
  const listeners = {};
  return {
    innerWidth: width,
    innerHeight: height,
    addEventListener: vi.fn((type, cb) => {
      listeners[type] = cb;
    }),
    removeEventListener: vi.fn((type) => {
      delete listeners[type];
    }),
    resize(w, h) {
      this.innerWidth = w;
      this.innerHeight = h;
      listeners.resize?.();
    },
  };
}

describe("pickPiPSize", () => {
  it("returns mini at the default PiP dimensions", () => {
    expect(pickPiPSize(200, 170)).toBe("mini");
  });

  it("steps up to compact once the window is wide and tall enough", () => {
    expect(pickPiPSize(320, 220)).toBe("compact");
  });

  it("steps up to default on a large window", () => {
    expect(pickPiPSize(480, 300)).toBe("default");
  });

  it("keeps the smaller tier when only one dimension grows", () => {
    expect(pickPiPSize(600, 170)).toBe("mini");
    expect(pickPiPSize(200, 600)).toBe("mini");
  });
});

describe("usePiPSize", () => {
  it("defaults to mini when there is no window", () => {
    const { result } = renderHook(() => usePiPSize(null));
    expect(result.current).toBe("mini");
  });

  it("tracks the window size across resize events", () => {
    const win = makeFakeWindow(200, 170);
    const { result } = renderHook(() => usePiPSize(win));

    expect(result.current).toBe("mini");

    act(() => win.resize(480, 300));
    expect(result.current).toBe("default");

    act(() => win.resize(320, 220));
    expect(result.current).toBe("compact");
  });

  it("stops listening when the window changes", () => {
    const win = makeFakeWindow(200, 170);
    const { rerender } = renderHook(({ w }) => usePiPSize(w), {
      initialProps: { w: win },
    });

    rerender({ w: null });
    expect(win.removeEventListener).toHaveBeenCalledWith(
      "resize",
      expect.any(Function),
    );
  });
});
