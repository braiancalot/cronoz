import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { pickLayout, useControlsLayout } from "@/hooks/useControlsLayout.js";

describe("pickLayout", () => {
  it("stacks a portrait viewport (more vertical room)", () => {
    expect(pickLayout(375, 738)).toBe("stacked");
    expect(pickLayout(375, 484)).toBe("stacked");
  });

  it("goes inline on a short landscape viewport (phone on its side)", () => {
    expect(pickLayout(738, 375)).toBe("inline");
  });

  it("stacks a square viewport (portrait-biased app)", () => {
    expect(pickLayout(400, 400)).toBe("stacked");
  });

  it("stacks a landscape viewport that is still tall (desktop, tablet)", () => {
    expect(pickLayout(1920, 1080)).toBe("stacked");
    expect(pickLayout(1024, 768)).toBe("stacked");
  });

  it("goes minimal on a split-screen sliver, whatever the proportion", () => {
    expect(pickLayout(375, 185)).toBe("minimal");
    expect(pickLayout(1280, 200)).toBe("minimal");
  });

  it("keeps a landscape phone out of minimal so it still shows laps", () => {
    expect(pickLayout(844, 390)).toBe("inline");
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

  it("keeps stacked on a desktop viewport", () => {
    window.innerWidth = 1920;
    window.innerHeight = 1080;
    const { result } = renderHook(() => useControlsLayout());
    expect(result.current).toBe("stacked");
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
