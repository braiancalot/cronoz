import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";

const { mockUpdate, mockUpdateServiceWorker, mockUseRegisterSW } = vi.hoisted(
  () => ({
    mockUpdate: vi.fn(),
    mockUpdateServiceWorker: vi.fn(),
    mockUseRegisterSW: vi.fn(),
  }),
);

vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: mockUseRegisterSW,
}));

import { useServiceWorkerUpdate } from "@/hooks/useServiceWorkerUpdate.js";

const UPDATE_INTERVAL_MS = 60 * 60 * 1000;
const registration = { update: mockUpdate };

function configureRegisterSW(needRefresh = false) {
  mockUseRegisterSW.mockImplementation((opts) => {
    opts?.onRegisteredSW?.("/sw.js", registration);
    return {
      needRefresh: [needRefresh, vi.fn()],
      updateServiceWorker: mockUpdateServiceWorker,
    };
  });
}

function setVisibility(value) {
  Object.defineProperty(document, "visibilityState", {
    value,
    configurable: true,
  });
}

describe("useServiceWorkerUpdate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockUpdate.mockClear();
    mockUpdate.mockResolvedValue(undefined);
    mockUpdateServiceWorker.mockClear();
    configureRegisterSW(false);
    setVisibility("visible");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("checks for updates when the app returns to the foreground", () => {
    renderHook(() => useServiceWorkerUpdate());
    mockUpdate.mockClear();

    document.dispatchEvent(new Event("visibilitychange"));

    expect(mockUpdate).toHaveBeenCalledOnce();
  });

  it("does not check for updates while hidden", () => {
    renderHook(() => useServiceWorkerUpdate());
    mockUpdate.mockClear();
    setVisibility("hidden");

    document.dispatchEvent(new Event("visibilitychange"));

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("checks for updates periodically", () => {
    renderHook(() => useServiceWorkerUpdate());
    mockUpdate.mockClear();

    vi.advanceTimersByTime(UPDATE_INTERVAL_MS);

    expect(mockUpdate).toHaveBeenCalledOnce();
  });

  it("stops checking after unmount", () => {
    const { unmount } = renderHook(() => useServiceWorkerUpdate());
    unmount();
    mockUpdate.mockClear();

    document.dispatchEvent(new Event("visibilitychange"));
    vi.advanceTimersByTime(UPDATE_INTERVAL_MS);

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("exposes needRefresh and updateServiceWorker", () => {
    configureRegisterSW(true);

    const { result } = renderHook(() => useServiceWorkerUpdate());

    expect(result.current.needRefresh).toBe(true);
    expect(result.current.updateServiceWorker).toBe(mockUpdateServiceWorker);
  });
});
