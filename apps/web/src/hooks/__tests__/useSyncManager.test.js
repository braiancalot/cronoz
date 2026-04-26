import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("@/services/syncManager.js", () => ({
  default: {
    sync: vi.fn(),
    start: vi.fn(),
  },
}));

import syncManager from "@/services/syncManager.js";
import { useSyncManager } from "@/hooks/useSyncManager.js";

let unsubscribe;

beforeEach(() => {
  vi.clearAllMocks();
  unsubscribe = vi.fn();
  syncManager.start.mockReturnValue(unsubscribe);
  Object.defineProperty(document, "visibilityState", {
    value: "visible",
    configurable: true,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useSyncManager", () => {
  it("starts the manager and triggers a sync on mount", () => {
    renderHook(() => useSyncManager());

    expect(syncManager.start).toHaveBeenCalledOnce();
    expect(syncManager.sync).toHaveBeenCalledOnce();
  });

  it("syncs when document becomes visible", () => {
    renderHook(() => useSyncManager());
    syncManager.sync.mockClear();

    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));

    expect(syncManager.sync).toHaveBeenCalledOnce();
  });

  it("does not sync when document becomes hidden", () => {
    renderHook(() => useSyncManager());
    syncManager.sync.mockClear();

    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));

    expect(syncManager.sync).not.toHaveBeenCalled();
  });

  it("unsubscribes and removes the visibilitychange listener on unmount", () => {
    const { unmount } = renderHook(() => useSyncManager());
    syncManager.sync.mockClear();

    unmount();

    expect(unsubscribe).toHaveBeenCalledOnce();

    document.dispatchEvent(new Event("visibilitychange"));
    expect(syncManager.sync).not.toHaveBeenCalled();
  });
});
