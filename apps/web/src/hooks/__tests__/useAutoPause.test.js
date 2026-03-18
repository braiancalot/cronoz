import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAutoPause } from "@/hooks/useAutoPause.js";

describe("useAutoPause", () => {
  let originalUserAgent;

  beforeEach(() => {
    originalUserAgent = navigator.userAgent;
  });

  afterEach(() => {
    Object.defineProperty(navigator, "userAgent", {
      value: originalUserAgent,
      configurable: true,
    });
  });

  it("calls pause on pagehide", () => {
    const pause = vi.fn();
    renderHook(() => useAutoPause(pause));

    window.dispatchEvent(new Event("pagehide"));

    expect(pause).toHaveBeenCalledOnce();
  });

  it("calls pause on visibilitychange when mobile and hidden", () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
      configurable: true,
    });

    const pause = vi.fn();
    renderHook(() => useAutoPause(pause));

    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));

    expect(pause).toHaveBeenCalledOnce();
  });

  it("does not pause on visibilitychange on desktop", () => {
    Object.defineProperty(navigator, "userAgent", {
      value:
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0",
      configurable: true,
    });

    const pause = vi.fn();
    renderHook(() => useAutoPause(pause));

    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));

    expect(pause).not.toHaveBeenCalled();
  });

  it("calls pause on unmount (cleanup)", () => {
    const pause = vi.fn();
    const { unmount } = renderHook(() => useAutoPause(pause));

    unmount();

    expect(pause).toHaveBeenCalledOnce();
  });
});
