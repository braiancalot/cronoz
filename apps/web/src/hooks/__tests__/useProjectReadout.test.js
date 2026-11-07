import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { DEFAULT_STOPWATCH } from "@/services/projectRepository.js";
import { RECOVERY_GRACE_PERIOD } from "@/lib/stopwatch.js";

const { mockUseLiveQuery, fakeRepository } = vi.hoisted(() => ({
  mockUseLiveQuery: vi.fn(),
  fakeRepository: { getById: vi.fn(), updateStopwatch: vi.fn() },
}));

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (...args) => mockUseLiveQuery(...args),
}));

vi.mock("@/services/projectRepository.js", async (importOriginal) => ({
  ...(await importOriginal()),
  default: fakeRepository,
}));

const { useProjectReadout } = await import("@/hooks/useProjectReadout.js");

function runningProject(now) {
  return {
    id: "project-1",
    name: "Projeto",
    stopwatch: {
      ...DEFAULT_STOPWATCH,
      isRunning: true,
      startTimestamp: now - 60_000,
      lastActiveAt: now,
      currentLapTime: 5_000,
      laps: [{ id: "lap-1", name: "Volta", lapTime: 10_000 }],
    },
  };
}

describe("useProjectReadout", () => {
  afterEach(() => vi.useRealTimers());

  it("advances a running stopwatch's current lap", () => {
    vi.useFakeTimers({ now: 1_000_000 });
    mockUseLiveQuery.mockReturnValue(runningProject(Date.now()));

    const { result } = renderHook(() => useProjectReadout("project-1"));
    expect(result.current.splitTime).toBe(65_000);

    act(() => vi.advanceTimersByTime(1_000));

    expect(result.current.splitTime).toBe(66_000);
  });

  it("leaves an abandoned run alone instead of recovering it", () => {
    vi.useFakeTimers({ now: 1_000_000 });
    const abandoned = runningProject(Date.now() - RECOVERY_GRACE_PERIOD);
    mockUseLiveQuery.mockReturnValue(abandoned);

    const { unmount } = renderHook(() => useProjectReadout("project-1"));
    unmount();

    expect(fakeRepository.updateStopwatch).not.toHaveBeenCalled();
  });
});
