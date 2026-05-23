import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWakeLock } from "@/hooks/useWakeLock.js";

function createSentinel() {
  const listeners = [];
  return {
    addEventListener: (event, listener) => {
      if (event === "release") listeners.push(listener);
    },
    release: vi.fn().mockImplementation(async function () {
      listeners.forEach((l) => l());
    }),
  };
}

function installWakeLock() {
  const sentinels = [];
  const request = vi.fn().mockImplementation(async () => {
    const sentinel = createSentinel();
    sentinels.push(sentinel);
    return sentinel;
  });
  Object.defineProperty(navigator, "wakeLock", {
    value: { request },
    configurable: true,
  });
  return { request, sentinels };
}

function uninstallWakeLock() {
  delete navigator.wakeLock;
}

function setVisibility(state) {
  Object.defineProperty(document, "visibilityState", {
    value: state,
    configurable: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("useWakeLock", () => {
  afterEach(() => {
    uninstallWakeLock();
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      configurable: true,
    });
  });

  it("does nothing when wakeLock API is unavailable", () => {
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow();
  });

  it("requests wake lock when active", async () => {
    const { request } = installWakeLock();

    await act(async () => {
      renderHook(() => useWakeLock(true));
    });

    expect(request).toHaveBeenCalledWith("screen");
  });

  it("does not request when inactive", () => {
    const { request } = installWakeLock();

    renderHook(() => useWakeLock(false));

    expect(request).not.toHaveBeenCalled();
  });

  it("releases lock when active flips to false", async () => {
    const { request, sentinels } = installWakeLock();

    const { rerender } = renderHook(({ active }) => useWakeLock(active), {
      initialProps: { active: true },
    });

    await act(async () => {});

    expect(request).toHaveBeenCalledOnce();
    expect(sentinels).toHaveLength(1);

    await act(async () => {
      rerender({ active: false });
    });

    expect(sentinels[0].release).toHaveBeenCalledOnce();
  });

  it("releases lock on unmount", async () => {
    const { sentinels } = installWakeLock();

    const { unmount } = renderHook(() => useWakeLock(true));
    await act(async () => {});

    unmount();

    expect(sentinels[0].release).toHaveBeenCalledOnce();
  });

  it("re-acquires lock on visibilitychange to visible when active", async () => {
    const { request, sentinels } = installWakeLock();

    renderHook(() => useWakeLock(true));
    await act(async () => {});

    expect(request).toHaveBeenCalledTimes(1);

    // Simulate browser releasing the lock when hidden
    await act(async () => {
      await sentinels[0].release();
    });

    await act(async () => {
      setVisibility("hidden");
    });
    await act(async () => {
      setVisibility("visible");
    });

    expect(request).toHaveBeenCalledTimes(2);
  });

  it("does not re-acquire on visibilitychange when inactive", async () => {
    const { request } = installWakeLock();

    renderHook(() => useWakeLock(false));

    await act(async () => {
      setVisibility("hidden");
    });
    await act(async () => {
      setVisibility("visible");
    });

    expect(request).not.toHaveBeenCalled();
  });

  it("swallows request errors", async () => {
    const request = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "wakeLock", {
      value: { request },
      configurable: true,
    });

    expect(() => renderHook(() => useWakeLock(true))).not.toThrow();
    await act(async () => {});
  });
});
