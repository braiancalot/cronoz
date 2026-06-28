import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { DEFAULT_STOPWATCH } from "@/services/projectRepository.js";

// vi.hoisted runs before vi.mock hoisting, making these available to factories
const { mockUseLiveQuery, mockRepository } = vi.hoisted(() => ({
  mockUseLiveQuery: vi.fn(),
  mockRepository: {
    getById: vi.fn(),
    setStopwatch: vi.fn(),
    rename: vi.fn(),
    remove: vi.fn(),
    undeleteProject: vi.fn(),
    addLap: vi.fn(),
    renameLap: vi.fn(),
    removeLap: vi.fn(),
    undeleteLap: vi.fn(),
  },
}));

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (...args) => mockUseLiveQuery(...args),
}));

vi.mock("@/services/projectRepository.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: mockRepository,
  };
});

// Stub requestAnimationFrame
vi.stubGlobal(
  "requestAnimationFrame",
  vi.fn((cb) => setTimeout(cb, 0)),
);
vi.stubGlobal(
  "cancelAnimationFrame",
  vi.fn((id) => clearTimeout(id)),
);

// Import after mocks are set up
const { useProject } = await import("@/hooks/useProject.js");

function createProject(stopwatchOverrides = {}) {
  return {
    id: "test-id",
    name: "Test Project",
    completedAt: null,
    createdAt: 1000,
    stopwatch: { ...DEFAULT_STOPWATCH, ...stopwatchOverrides },
  };
}

describe("useProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns isLoading true when project is undefined", () => {
    mockUseLiveQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useProject("test-id"));

    expect(result.current.isLoading).toBe(true);
  });

  it("returns project data when loaded", () => {
    const project = createProject();
    mockUseLiveQuery.mockReturnValue(project);

    const { result } = renderHook(() => useProject("test-id"));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.project).toEqual(project);
  });

  it("start saves project with isRunning true and lastActiveAt set", () => {
    const project = createProject();
    mockUseLiveQuery.mockReturnValue(project);

    const { result } = renderHook(() => useProject("test-id"));

    act(() => {
      result.current.start();
    });

    expect(mockRepository.setStopwatch).toHaveBeenCalledWith(
      "test-id",
      expect.objectContaining({
        isRunning: true,
        startTimestamp: expect.any(Number),
        lastActiveAt: expect.any(Number),
      }),
    );
  });

  it("pause saves project with isRunning false and accumulated currentLapTime", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(10000));

    const project = createProject({
      isRunning: true,
      startTimestamp: 7000,
      currentLapTime: 2000,
    });
    mockUseLiveQuery.mockReturnValue(project);

    const { result } = renderHook(() => useProject("test-id"));

    act(() => {
      result.current.pause();
    });

    expect(mockRepository.setStopwatch).toHaveBeenCalledWith(
      "test-id",
      expect.objectContaining({
        isRunning: false,
        startTimestamp: null,
        currentLapTime: 5000, // 2000 + (10000 - 7000)
      }),
    );

    vi.useRealTimers();
  });

  it("pause does nothing when not running", () => {
    const project = createProject({ isRunning: false });
    mockUseLiveQuery.mockReturnValue(project);

    const { result } = renderHook(() => useProject("test-id"));

    act(() => {
      result.current.pause();
    });

    expect(mockRepository.setStopwatch).not.toHaveBeenCalled();
  });

  it("reset saves project with DEFAULT_STOPWATCH", () => {
    const project = createProject({ currentLapTime: 5000 });
    mockUseLiveQuery.mockReturnValue(project);

    const { result } = renderHook(() => useProject("test-id"));

    act(() => {
      result.current.reset();
    });

    expect(mockRepository.setStopwatch).toHaveBeenCalledWith(
      "test-id",
      DEFAULT_STOPWATCH,
    );
  });

  it("reset returns an undo that restores the previous stopwatch (paused)", () => {
    const laps = [{ id: "l1", name: "Volta 1", lapTime: 1000 }];
    const project = createProject({
      currentLapTime: 5000,
      isRunning: true,
      startTimestamp: 1000,
      lastActiveAt: 2000,
      laps,
    });
    mockUseLiveQuery.mockReturnValue(project);

    const { result } = renderHook(() => useProject("test-id"));

    let undoer;
    act(() => {
      undoer = result.current.reset();
    });
    expect(undoer).toEqual(
      expect.objectContaining({ undo: expect.any(Function) }),
    );

    mockRepository.setStopwatch.mockClear();

    act(() => {
      undoer.undo();
    });

    expect(mockRepository.setStopwatch).toHaveBeenCalledWith("test-id", {
      ...project.stopwatch,
      isRunning: false,
      startTimestamp: null,
      lastActiveAt: null,
    });
  });

  it("discardCurrentTime zeroes currentLapTime and pauses", () => {
    const project = createProject({
      isRunning: true,
      startTimestamp: 1000,
      currentLapTime: 4000,
    });
    mockUseLiveQuery.mockReturnValue(project);

    const { result } = renderHook(() => useProject("test-id"));

    act(() => {
      result.current.discardCurrentTime();
    });

    expect(mockRepository.setStopwatch).toHaveBeenCalledWith(
      "test-id",
      expect.objectContaining({
        isRunning: false,
        startTimestamp: null,
        lastActiveAt: null,
        currentLapTime: 0,
      }),
    );
  });

  it("discardCurrentTime returns an undo that restores the prior currentLapTime (paused)", () => {
    const project = createProject({
      isRunning: true,
      startTimestamp: 1000,
      currentLapTime: 4000,
    });
    mockUseLiveQuery.mockReturnValue(project);

    const { result } = renderHook(() => useProject("test-id"));

    let undoer;
    act(() => {
      undoer = result.current.discardCurrentTime();
    });
    expect(undoer).toEqual(
      expect.objectContaining({ undo: expect.any(Function) }),
    );

    mockRepository.setStopwatch.mockClear();

    act(() => {
      undoer.undo();
    });

    expect(mockRepository.setStopwatch).toHaveBeenCalledWith("test-id", {
      ...project.stopwatch,
      isRunning: false,
      startTimestamp: null,
      lastActiveAt: null,
    });
  });

  describe("setCurrentTime", () => {
    it("commits the given value as currentLapTime", () => {
      const project = createProject({ currentLapTime: 5000 });
      mockUseLiveQuery.mockReturnValue(project);

      const { result } = renderHook(() => useProject("test-id"));

      act(() => {
        result.current.setCurrentTime(15000);
      });

      expect(mockRepository.setStopwatch).toHaveBeenCalledWith(
        "test-id",
        expect.objectContaining({ currentLapTime: 15000 }),
      );
    });

    it("clamps negative values to 0", () => {
      const project = createProject({ currentLapTime: 5000 });
      mockUseLiveQuery.mockReturnValue(project);

      const { result } = renderHook(() => useProject("test-id"));

      act(() => {
        result.current.setCurrentTime(-2000);
      });

      expect(mockRepository.setStopwatch).toHaveBeenCalledWith(
        "test-id",
        expect.objectContaining({ currentLapTime: 0 }),
      );
    });

    it("keeps the stopwatch paused", () => {
      const project = createProject({
        currentLapTime: 5000,
        isRunning: false,
      });
      mockUseLiveQuery.mockReturnValue(project);

      const { result } = renderHook(() => useProject("test-id"));

      act(() => {
        result.current.setCurrentTime(6000);
      });

      expect(mockRepository.setStopwatch).toHaveBeenCalledWith(
        "test-id",
        expect.objectContaining({ isRunning: false, currentLapTime: 6000 }),
      );
    });
  });

  it("toggle calls start when stopped", () => {
    const project = createProject({ isRunning: false });
    mockUseLiveQuery.mockReturnValue(project);

    const { result } = renderHook(() => useProject("test-id"));

    act(() => {
      result.current.toggle();
    });

    expect(mockRepository.setStopwatch).toHaveBeenCalledWith(
      "test-id",
      expect.objectContaining({ isRunning: true }),
    );
  });

  it("toggle calls pause when running", () => {
    const project = createProject({
      isRunning: true,
      startTimestamp: Date.now(),
      currentLapTime: 1000,
    });
    mockUseLiveQuery.mockReturnValue(project);

    const { result } = renderHook(() => useProject("test-id"));

    act(() => {
      result.current.toggle();
    });

    expect(mockRepository.setStopwatch).toHaveBeenCalledWith(
      "test-id",
      expect.objectContaining({ isRunning: false }),
    );
  });

  it("addLap calls repository with calculated lapTime and name", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(10000));

    const project = createProject({
      isRunning: true,
      startTimestamp: 7000,
      currentLapTime: 2000,
    });
    mockUseLiveQuery.mockReturnValue(project);

    const { result } = renderHook(() => useProject("test-id"));

    act(() => {
      result.current.addLap("Volta 1");
    });

    expect(mockRepository.addLap).toHaveBeenCalledWith({
      id: "test-id",
      lapTime: 5000, // currentLapTime (2000) + elapsed (10000 - 7000)
      name: "Volta 1",
    });

    vi.useRealTimers();
  });

  it("rename calls repository with new name", async () => {
    const project = createProject();
    mockUseLiveQuery.mockReturnValue(project);

    const { result } = renderHook(() => useProject("test-id"));

    await act(async () => {
      await result.current.rename("New Name");
    });

    expect(mockRepository.rename).toHaveBeenCalledWith({
      id: "test-id",
      newName: "New Name",
    });
  });

  it("rename does nothing with empty name", async () => {
    const project = createProject();
    mockUseLiveQuery.mockReturnValue(project);

    const { result } = renderHook(() => useProject("test-id"));

    await act(async () => {
      await result.current.rename("");
    });

    expect(mockRepository.rename).not.toHaveBeenCalled();
  });

  it("deleteProject calls repository remove", async () => {
    const project = createProject();
    mockUseLiveQuery.mockReturnValue(project);

    const { result } = renderHook(() => useProject("test-id"));

    await act(async () => {
      await result.current.deleteProject();
    });

    expect(mockRepository.remove).toHaveBeenCalledWith("test-id");
  });

  it("deleteProject returns an undo that calls undeleteProject", async () => {
    const project = createProject();
    mockUseLiveQuery.mockReturnValue(project);

    const { result } = renderHook(() => useProject("test-id"));

    let undoer;
    await act(async () => {
      undoer = await result.current.deleteProject();
    });
    expect(undoer).toEqual(
      expect.objectContaining({ undo: expect.any(Function) }),
    );

    act(() => {
      undoer.undo();
    });

    expect(mockRepository.undeleteProject).toHaveBeenCalledWith("test-id");
  });

  it("renameLap calls repository", async () => {
    const project = createProject();
    mockUseLiveQuery.mockReturnValue(project);

    const { result } = renderHook(() => useProject("test-id"));

    await act(async () => {
      await result.current.renameLap("lap-1", "Custom");
    });

    expect(mockRepository.renameLap).toHaveBeenCalledWith({
      id: "test-id",
      lapId: "lap-1",
      name: "Custom",
    });
  });

  it("addLap works correctly when stopwatch is paused (regression: stale state overwrite)", () => {
    const project = createProject({
      isRunning: false,
      startTimestamp: null,
      currentLapTime: 5000,
    });
    mockUseLiveQuery.mockReturnValue(project);

    const { result } = renderHook(() => useProject("test-id"));

    act(() => {
      result.current.addLap("Volta 1");
    });

    expect(mockRepository.addLap).toHaveBeenCalledWith({
      id: "test-id",
      lapTime: 5000,
      name: "Volta 1",
    });

    // Must NOT touch the stopwatch write path — start() was the original
    // culprit of the stale-state overwrite bug.
    expect(mockRepository.setStopwatch).not.toHaveBeenCalled();
  });

  it("deleteLap calls repository", async () => {
    const project = createProject();
    mockUseLiveQuery.mockReturnValue(project);

    const { result } = renderHook(() => useProject("test-id"));

    await act(async () => {
      await result.current.deleteLap("lap-1");
    });

    expect(mockRepository.removeLap).toHaveBeenCalledWith({
      id: "test-id",
      lapId: "lap-1",
    });
  });

  it("deleteLap returns an undo that calls undeleteLap", async () => {
    const project = createProject();
    mockUseLiveQuery.mockReturnValue(project);

    const { result } = renderHook(() => useProject("test-id"));

    let undoer;
    await act(async () => {
      undoer = await result.current.deleteLap("lap-1");
    });
    expect(undoer).toEqual(
      expect.objectContaining({ undo: expect.any(Function) }),
    );

    act(() => {
      undoer.undo();
    });

    expect(mockRepository.undeleteLap).toHaveBeenCalledWith({
      id: "test-id",
      lapId: "lap-1",
    });
  });

  describe("recovery (abandoned timer)", () => {
    it("auto-pauses a running timer with stale lastActiveAt on mount", () => {
      const project = createProject({
        isRunning: true,
        startTimestamp: 5000,
        currentLapTime: 2000,
        lastActiveAt: 15000, // far in the past relative to wall clock → stale
      });
      mockUseLiveQuery.mockReturnValue(project);

      renderHook(() => useProject("test-id"));

      expect(mockRepository.setStopwatch).toHaveBeenCalledWith(
        "test-id",
        expect.objectContaining({
          isRunning: false,
          startTimestamp: null,
          lastActiveAt: null,
          currentLapTime: 12000, // 2000 + (15000 - 5000)
        }),
      );
    });

    it("does not recover a running timer without lastActiveAt", () => {
      const project = createProject({
        isRunning: true,
        startTimestamp: Date.now(),
        currentLapTime: 0,
        lastActiveAt: null,
      });
      mockUseLiveQuery.mockReturnValue(project);

      renderHook(() => useProject("test-id"));

      expect(mockRepository.setStopwatch).not.toHaveBeenCalled();
    });

    it("does not recover a paused timer", () => {
      const project = createProject({
        isRunning: false,
        lastActiveAt: 15000,
      });
      mockUseLiveQuery.mockReturnValue(project);

      renderHook(() => useProject("test-id"));

      expect(mockRepository.setStopwatch).not.toHaveBeenCalled();
    });

    it("does not recover when the timer was just started (fresh lastActiveAt)", () => {
      const pausedProject = createProject({ isRunning: false });
      mockUseLiveQuery.mockReturnValue(pausedProject);

      const { rerender } = renderHook(() => useProject("test-id"));

      // User starts: lastActiveAt is set to now → staleness check fails → no recovery
      const now = Date.now();
      const runningProject = createProject({
        isRunning: true,
        startTimestamp: now,
        currentLapTime: 0,
        lastActiveAt: now,
      });
      mockUseLiveQuery.mockReturnValue(runningProject);

      rerender();

      expect(mockRepository.setStopwatch).not.toHaveBeenCalled();
    });

    // Regression: cross-device scenario where a phone has a stale local copy
    // (e.g., paused or non-existent) and then a sync pull brings the running
    // stopwatch with a stale heartbeat. Recovery must fire on the post-pull
    // render — not get gated out by a one-shot guard set on the first render.
    it("recovers when sync pull brings a stale running stopwatch after a paused initial render", () => {
      // Initial local state: paused (this device hadn't synced yet)
      const pausedProject = createProject({ isRunning: false });
      mockUseLiveQuery.mockReturnValue(pausedProject);

      const { rerender } = renderHook(() => useProject("test-id"));

      expect(mockRepository.setStopwatch).not.toHaveBeenCalled();

      // Sync pull arrives with running stopwatch + ancient heartbeat
      const stalePulled = createProject({
        isRunning: true,
        startTimestamp: 5_000,
        currentLapTime: 2_000,
        lastActiveAt: 15_000, // stale relative to wall clock
      });
      mockUseLiveQuery.mockReturnValue(stalePulled);

      rerender();

      expect(mockRepository.setStopwatch).toHaveBeenCalledWith(
        "test-id",
        expect.objectContaining({
          isRunning: false,
          startTimestamp: null,
          lastActiveAt: null,
          currentLapTime: 12_000, // 2_000 + (15_000 - 5_000)
        }),
      );
    });

    // Regression: when recovery and checkpoint were in separate effects, the
    // checkpoint loop could fire a stale lastActiveAt write right after
    // recovery had pushed the pause, undoing it.
    it("does not write checkpoint after recovery pauses the run", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(1_000_000));

      const project = createProject({
        isRunning: true,
        startTimestamp: 5_000,
        currentLapTime: 2_000,
        lastActiveAt: 15_000, // ancient — far past grace period
      });
      mockUseLiveQuery.mockReturnValue(project);

      renderHook(() => useProject("test-id"));

      // Let any pending rAF ticks fire. Without the consolidation, the
      // checkpoint loop would write a fresh lastActiveAt here.
      await act(() => vi.advanceTimersByTime(100));

      // Recovery must be the ONLY setStopwatch call. A second call would
      // be the stale checkpoint write overwriting the pause.
      expect(mockRepository.setStopwatch).toHaveBeenCalledTimes(1);
      expect(mockRepository.setStopwatch).toHaveBeenCalledWith(
        "test-id",
        expect.objectContaining({ isRunning: false }),
      );

      vi.useRealTimers();
    });

    it("does not recover when lastActiveAt is within grace period (another device may be alive)", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(100_000));

      const project = createProject({
        isRunning: true,
        startTimestamp: 5_000,
        currentLapTime: 2_000,
        lastActiveAt: 95_000, // 5s ago — fresh heartbeat
      });
      mockUseLiveQuery.mockReturnValue(project);

      renderHook(() => useProject("test-id"));

      expect(mockRepository.setStopwatch).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe("checkpoint (lastActiveAt)", () => {
    it("writes lastActiveAt periodically while timer is running", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(100000));

      const project = createProject({
        isRunning: true,
        startTimestamp: 90000,
        currentLapTime: 0,
      });
      mockUseLiveQuery.mockReturnValue(project);

      renderHook(() => useProject("test-id"));

      // Trigger first rAF tick — no checkpoint yet (interval not elapsed)
      await act(() => vi.advanceTimersByTime(1));
      expect(mockRepository.setStopwatch).not.toHaveBeenCalled();

      // Advance system time past checkpoint interval and trigger rAF
      vi.setSystemTime(new Date(110001));
      await act(() => vi.runOnlyPendingTimers());

      expect(mockRepository.setStopwatch).toHaveBeenCalledWith(
        "test-id",
        expect.objectContaining({
          lastActiveAt: expect.any(Number),
          isRunning: true,
        }),
      );

      vi.useRealTimers();
    });

    it("does not write checkpoint before interval elapses", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(100000));

      const project = createProject({
        isRunning: true,
        startTimestamp: 95000,
        currentLapTime: 0,
      });
      mockUseLiveQuery.mockReturnValue(project);

      renderHook(() => useProject("test-id"));

      // Advance only 5 seconds (less than 10s interval)
      vi.setSystemTime(new Date(105000));
      vi.advanceTimersByTime(0);

      expect(mockRepository.setStopwatch).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it("pause clears lastActiveAt", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(10000));

      const project = createProject({
        isRunning: true,
        startTimestamp: 7000,
        currentLapTime: 2000,
        lastActiveAt: 9000,
      });
      mockUseLiveQuery.mockReturnValue(project);

      const { result } = renderHook(() => useProject("test-id"));

      act(() => {
        result.current.pause();
      });

      expect(mockRepository.setStopwatch).toHaveBeenCalledWith(
        "test-id",
        expect.objectContaining({
          isRunning: false,
          lastActiveAt: null,
        }),
      );

      vi.useRealTimers();
    });
  });
});
