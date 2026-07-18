import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { pickLayout, useControlsLayout } from "@/hooks/useControlsLayout.js";

describe("pickLayout", () => {
  it("stacks a portrait viewport (more vertical room)", () => {
    expect(pickLayout(375, 738)).toBe("stacked");
    expect(pickLayout(375, 484)).toBe("stacked");
  });

  it("goes inline on a landscape viewport (more horizontal room)", () => {
    expect(pickLayout(738, 375)).toBe("inline");
  });

  it("stacks a square viewport (portrait-biased app)", () => {
    expect(pickLayout(400, 400)).toBe("stacked");
  });
});

describe("useControlsLayout", () => {
  let listeners;

  beforeEach(() => {
    listeners = new Set();
    vi.stubGlobal("window", {
      innerWidth: 375,
      innerHeight: 738,
      visualViewport: null,
      addEventListener: (event, handler) => listeners.add(handler),
      removeEventListener: (event, handler) => listeners.delete(handler),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function resizeTo(width, height) {
    window.innerWidth = width;
    window.innerHeight = height;
    act(() => listeners.forEach((handler) => handler()));
  }

  it("returns stacked for a portrait viewport", () => {
    const { result } = renderHook(() => useControlsLayout());
    expect(result.current).toBe("stacked");
  });

  it("keeps stacked on a short portrait viewport (e.g. a popup window)", () => {
    window.innerHeight = 484;
    const { result } = renderHook(() => useControlsLayout());
    expect(result.current).toBe("stacked");
  });

  it("switches to inline when the viewport turns landscape", () => {
    const { result } = renderHook(() => useControlsLayout());
    expect(result.current).toBe("stacked");
    resizeTo(738, 375);
    expect(result.current).toBe("inline");
  });

  it("prefers visualViewport dimensions when available", () => {
    window.visualViewport = {
      width: 738,
      height: 375,
      addEventListener: (event, handler) => listeners.add(handler),
      removeEventListener: (event, handler) => listeners.delete(handler),
    };
    const { result } = renderHook(() => useControlsLayout());
    expect(result.current).toBe("inline");
  });
});
