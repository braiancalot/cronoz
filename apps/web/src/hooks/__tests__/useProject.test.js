import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { DEFAULT_STOPWATCH } from "@/services/projectRepository.js";
import {
  appendLap,
  markLapDeleted,
  restoreLap,
} from "@/lib/stopwatchTransitions.js";

// vi.hoisted runs before vi.mock hoisting, making these available to factories
const { mockUseLiveQuery, mockRepository } = vi.hoisted(() => ({
  mockUseLiveQuery: vi.fn(),
  mockRepository: {
    getById: vi.fn(),
    updateStopwatch: vi.fn(),
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

// Stands in for the Dexie record: applies each transform the hook sends the
// way projectRepository.updateStopwatch does, and keeps what was written.
class FakeStopwatchStore {
  constructor(stopwatch) {
    this.stopwatch = stopwatch;
    this.writes = [];
  }

  async update(_id, transform) {
    const previous = this.stopwatch;
    const next = transform(previous);
    if (next === previous) return null;
    this.stopwatch = next;
    this.writes.push(next);
    return { previous, next };
  }

  get last() {
    return this.writes.at(-1);
  }
}

let store;

// Loads the project into both the live query and the fake record. A rerender
// with another project means a sync pull replaced the record.
function load(project) {
  mockUseLiveQuery.mockReturnValue(project);
  store.stopwatch = project.stopwatch;
}

describe("useProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store = new FakeStopwatchStore(DEFAULT_STOPWATCH);
    mockRepository.updateStopwatch.mockImplementation((id, transform) =>
      store.update(id, transform),
    );
  });

  it("returns isLoading true when project is undefined", () => {
    mockUseLiveQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useProject("test-id"));

    expect(result.current.isLoading).toBe(true);
  });

  it("returns project data when loaded", () => {
    const project = createProject();
    load(project);

    const { result } = renderHook(() => useProject("test-id"));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.project).toEqual(project);
  });

  it("start saves project with isRunning true and lastActiveAt set", () => {
    const project = createProject();
    load(project);

    const { result } = renderHook(() => useProject("test-id"));

    act(() => {
      result.current.start();
    });

    expect(store.last).toMatchObject({
      isRunning: true,
      startTimestamp: expect.any(Number),
      lastActiveAt: expect.any(Number),
    });
  });

  it("pause saves project with isRunning false and accumulated currentLapTime", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(10000));

    const project = createProject({
      isRunning: true,
      startTimestamp: 7000,
      currentLapTime: 2000,
    });
    load(project);

    const { result } = renderHook(() => useProject("test-id"));

    act(() => {
      result.current.pause();
    });

    expect(store.last).toMatchObject({
      isRunning: false,
      startTimestamp: null,
      currentLapTime: 5000, // 2000 + (10000 - 7000)
    });

    vi.useRealTimers();
  });

  it("pause does nothing when not running", () => {
    const project = createProject({ isRunning: false });
    load(project);

    const { result } = renderHook(() => useProject("test-id"));

    act(() => {
      result.current.pause();
    });

    expect(store.writes).toHaveLength(0);
  });

  it("discardCurrentTime zeroes currentLapTime and pauses", () => {
    const project = createProject({
      isRunning: true,
      startTimestamp: 1000,
      currentLapTime: 4000,
    });
    load(project);

    const { result } = renderHook(() => useProject("test-id"));

    act(() => {
      result.current.discardCurrentTime();
    });

    expect(store.last).toMatchObject({
      isRunning: false,
      startTimestamp: null,
      lastActiveAt: null,
      currentLapTime: 0,
    });
  });

  it("discardCurrentTime returns an undo that restores the discarded time (paused)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(10_000));
    load(createProject({ isRunning: true, startTimestamp: 7000 }));

    const { result } = renderHook(() => useProject("test-id"));

    let undoer;
    await act(async () => {
      undoer = await result.current.discardCurrentTime();
    });
    await act(() => undoer.undo());

    expect(store.last).toMatchObject({
      isRunning: false,
      startTimestamp: null,
      currentLapTime: 3000,
      realTime: 3000,
      editedTime: 0,
    });

    vi.useRealTimers();
  });

  it("discardCurrentTime records the discarded run as real time and the drop as an edit", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(10_000));
    load(createProject({ isRunning: true, startTimestamp: 7000 }));

    const { result } = renderHook(() => useProject("test-id"));
    await act(() => result.current.discardCurrentTime());

    expect(store.last).toMatchObject({
      currentLapTime: 0,
      realTime: 3000,
      editedTime: -3000,
    });

    vi.useRealTimers();
  });

  // The undo used to restore a snapshot, which erased a run made after the
  // discard. It now adds the discarded amount back on top.
  it("discardCurrentTime undo keeps a run made after the discard", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(10_000));
    load(createProject({ isRunning: true, startTimestamp: 7000 }));

    const { result } = renderHook(() => useProject("test-id"));
    let undoer;
    await act(async () => {
      undoer = await result.current.discardCurrentTime();
    });

    store.stopwatch = {
      ...store.stopwatch,
      currentLapTime: 500,
      realTime: 3500,
    };
    await act(() => undoer.undo());

    expect(store.last).toMatchObject({
      currentLapTime: 3500,
      realTime: 3500,
      editedTime: 0,
    });

    vi.useRealTimers();
  });

  it("discardCurrentTime with nothing to discard returns an undo that writes nothing", async () => {
    load(createProject());

    const { result } = renderHook(() => useProject("test-id"));
    let undoer;
    await act(async () => {
      undoer = await result.current.discardCurrentTime();
    });
    await act(() => undoer.undo());

    expect(store.writes).toHaveLength(0);
  });

  describe("setCurrentTime", () => {
    it("commits the given value as currentLapTime", () => {
      const project = createProject({ currentLapTime: 5000 });
      load(project);

      const { result } = renderHook(() => useProject("test-id"));

      act(() => {
        result.current.setCurrentTime(15000);
      });

      expect(store.last).toMatchObject({ currentLapTime: 15000 });
    });

    it("clamps negative values to 0", () => {
      const project = createProject({ currentLapTime: 5000 });
      load(project);

      const { result } = renderHook(() => useProject("test-id"));

      act(() => {
        result.current.setCurrentTime(-2000);
      });

      expect(store.last).toMatchObject({ currentLapTime: 0 });
    });

    it("keeps the stopwatch paused", () => {
      const project = createProject({
        currentLapTime: 5000,
        isRunning: false,
      });
      load(project);

      const { result } = renderHook(() => useProject("test-id"));

      act(() => {
        result.current.setCurrentTime(6000);
      });

      expect(store.last).toMatchObject({
        isRunning: false,
        currentLapTime: 6000,
      });
    });
  });

  it("toggle calls start when stopped", () => {
    const project = createProject({ isRunning: false });
    load(project);

    const { result } = renderHook(() => useProject("test-id"));

    act(() => {
      result.current.toggle();
    });

    expect(store.last).toMatchObject({ isRunning: true });
  });

  it("toggle calls pause when running", () => {
    const project = createProject({
      isRunning: true,
      startTimestamp: Date.now(),
      currentLapTime: 1000,
    });
    load(project);

    const { result } = renderHook(() => useProject("test-id"));

    act(() => {
      result.current.toggle();
    });

    expect(store.last).toMatchObject({ isRunning: false });
  });

  // The lap time comes from the stored record, inside the repository's
  // transaction, so a stale render cannot hand it an old value.
  it("addLap calls repository with the project id and name only", async () => {
    load(createProject({ isRunning: true, startTimestamp: 7000 }));

    const { result } = renderHook(() => useProject("test-id"));
    await act(() => result.current.addLap("Volta 1"));

    expect(mockRepository.addLap).toHaveBeenCalledWith({
      id: "test-id",
      name: "Volta 1",
    });
  });

  it("rename calls repository with new name", async () => {
    const project = createProject();
    load(project);

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
    load(project);

    const { result } = renderHook(() => useProject("test-id"));

    await act(async () => {
      await result.current.rename("");
    });

    expect(mockRepository.rename).not.toHaveBeenCalled();
  });

  it("deleteProject calls repository remove", async () => {
    const project = createProject();
    load(project);

    const { result } = renderHook(() => useProject("test-id"));

    await act(async () => {
      await result.current.deleteProject();
    });

    expect(mockRepository.remove).toHaveBeenCalledWith("test-id");
  });

  it("deleteProject returns an undo that calls undeleteProject", async () => {
    const project = createProject();
    load(project);

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
    load(project);

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

  it("addLap does not write the stopwatch itself (regression: stale state overwrite)", async () => {
    load(createProject({ currentLapTime: 5000 }));

    const { result } = renderHook(() => useProject("test-id"));
    await act(() => result.current.addLap("Volta 1"));

    // start() was the original culprit of the stale-state overwrite bug.
    expect(store.writes).toHaveLength(0);
  });

  it("deleteLap calls repository", async () => {
    const project = createProject();
    load(project);

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
    load(project);

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
      load(project);

      renderHook(() => useProject("test-id"));

      expect(store.last).toMatchObject({
        isRunning: false,
        startTimestamp: null,
        lastActiveAt: null,
        currentLapTime: 12000, // 2000 + (15000 - 5000)
      });
    });

    it("does not recover a running timer without lastActiveAt", () => {
      const project = createProject({
        isRunning: true,
        startTimestamp: Date.now(),
        currentLapTime: 0,
        lastActiveAt: null,
      });
      load(project);

      renderHook(() => useProject("test-id"));

      expect(store.writes).toHaveLength(0);
    });

    it("does not recover a paused timer", () => {
      const project = createProject({
        isRunning: false,
        lastActiveAt: 15000,
      });
      load(project);

      renderHook(() => useProject("test-id"));

      expect(store.writes).toHaveLength(0);
    });

    it("does not recover when the timer was just started (fresh lastActiveAt)", () => {
      const pausedProject = createProject({ isRunning: false });
      load(pausedProject);

      const { rerender } = renderHook(() => useProject("test-id"));

      // User starts: lastActiveAt is set to now → staleness check fails → no recovery
      const now = Date.now();
      const runningProject = createProject({
        isRunning: true,
        startTimestamp: now,
        currentLapTime: 0,
        lastActiveAt: now,
      });
      load(runningProject);

      rerender();

      expect(store.writes).toHaveLength(0);
    });

    // Regression: cross-device scenario where a phone has a stale local copy
    // (e.g., paused or non-existent) and then a sync pull brings the running
    // stopwatch with a stale heartbeat. Recovery must fire on the post-pull
    // render — not get gated out by a one-shot guard set on the first render.
    it("recovers when sync pull brings a stale running stopwatch after a paused initial render", () => {
      // Initial local state: paused (this device hadn't synced yet)
      const pausedProject = createProject({ isRunning: false });
      load(pausedProject);

      const { rerender } = renderHook(() => useProject("test-id"));

      expect(store.writes).toHaveLength(0);

      // Sync pull arrives with running stopwatch + ancient heartbeat
      const stalePulled = createProject({
        isRunning: true,
        startTimestamp: 5_000,
        currentLapTime: 2_000,
        lastActiveAt: 15_000, // stale relative to wall clock
      });
      load(stalePulled);

      rerender();

      expect(store.last).toMatchObject({
        isRunning: false,
        startTimestamp: null,
        lastActiveAt: null,
        currentLapTime: 12_000, // 2_000 + (15_000 - 5_000)
      });
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
      load(project);

      renderHook(() => useProject("test-id"));

      // Let any pending rAF ticks fire. Without the consolidation, the
      // checkpoint loop would write a fresh lastActiveAt here.
      await act(() => vi.advanceTimersByTime(100));

      // Recovery must be the ONLY write. A second one would be the stale
      // checkpoint write overwriting the pause.
      expect(store.writes).toHaveLength(1);
      expect(store.last).toMatchObject({ isRunning: false });

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
      load(project);

      renderHook(() => useProject("test-id"));

      expect(store.writes).toHaveLength(0);

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
      load(project);

      renderHook(() => useProject("test-id"));

      // Trigger first rAF tick — no checkpoint yet (interval not elapsed)
      await act(() => vi.advanceTimersByTime(1));
      expect(store.writes).toHaveLength(0);

      // Advance system time past checkpoint interval and trigger rAF
      vi.setSystemTime(new Date(110001));
      await act(() => vi.runOnlyPendingTimers());

      expect(store.last).toMatchObject({
        lastActiveAt: expect.any(Number),
        isRunning: true,
      });

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
      load(project);

      renderHook(() => useProject("test-id"));

      vi.setSystemTime(new Date(105000));
      vi.advanceTimersByTime(0);

      expect(store.writes).toHaveLength(0);

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
      load(project);

      const { result } = renderHook(() => useProject("test-id"));

      act(() => {
        result.current.pause();
      });

      expect(store.last).toMatchObject({
        isRunning: false,
        lastActiveAt: null,
      });

      vi.useRealTimers();
    });
  });

  describe("real time", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(100_000));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("pause adds the run to the real time", () => {
      load(
        createProject({
          isRunning: true,
          startTimestamp: 97_000,
          lastActiveAt: 97_000,
          currentLapTime: 2000,
          realTime: 2000,
        }),
      );

      const { result } = renderHook(() => useProject("test-id"));
      act(() => result.current.pause());

      expect(store.last).toMatchObject({
        currentLapTime: 5000,
        realTime: 5000,
        editedTime: 0,
      });
    });

    it("setCurrentTime records the change as an edit, not as real time", async () => {
      load(createProject({ currentLapTime: 5000, realTime: 5000 }));

      const { result } = renderHook(() => useProject("test-id"));
      await act(() => result.current.setCurrentTime(60_000));

      expect(store.last).toMatchObject({
        currentLapTime: 60_000,
        realTime: 5000,
        editedTime: 55_000,
      });
    });

    it("recovery adds the run up to the last heartbeat", () => {
      load(
        createProject({
          isRunning: true,
          startTimestamp: 5000,
          lastActiveAt: 15_000,
        }),
      );

      renderHook(() => useProject("test-id"));

      expect(store.last).toMatchObject({
        isRunning: false,
        currentLapTime: 10_000,
        realTime: 10_000,
      });
    });

    it("leaves a project from before the feature without real time", () => {
      const { realTime: _r, editedTime: _e, ...legacy } = DEFAULT_STOPWATCH;
      load({
        ...createProject(),
        stopwatch: {
          ...legacy,
          isRunning: true,
          startTimestamp: 97_000,
          lastActiveAt: 97_000,
        },
      });

      const { result } = renderHook(() => useProject("test-id"));
      act(() => result.current.pause());

      expect(store.last.currentLapTime).toBe(3000);
      expect(store.last).not.toHaveProperty("realTime");
      expect(store.last).not.toHaveProperty("editedTime");
    });

    // The checkpoint used to write the rendered stopwatch back with a fresh
    // heartbeat. Landing after a pause, it restarted the clock and the pause
    // was lost. It now only touches a record that is still running.
    it("a checkpoint that lands after a pause does not restart the run", async () => {
      load(
        createProject({
          isRunning: true,
          startTimestamp: 95_000,
          lastActiveAt: 95_000,
        }),
      );
      renderHook(() => useProject("test-id"));

      store.stopwatch = {
        ...store.stopwatch,
        isRunning: false,
        startTimestamp: null,
        lastActiveAt: null,
        currentLapTime: 5000,
        realTime: 5000,
      };
      vi.setSystemTime(new Date(110_000));
      await act(() => vi.runOnlyPendingTimers());

      expect(store.writes).toHaveLength(0);
      expect(store.stopwatch.isRunning).toBe(false);
    });
  });

  // The live query never re-emits in these tests, which is the gap between a
  // Dexie write and the next useLiveQuery value.
  describe("lap writes before the live query catches up", () => {
    const LAP = { id: "lap-1", name: "1º Base", lapTime: 4000, createdAt: 1 };

    function stubLapWrites() {
      mockRepository.addLap.mockImplementation(({ id, name }) =>
        store.update(id, (sw) =>
          appendLap(sw, { id: "lap-2", name, createdAt: 2 }, Date.now()),
        ),
      );
      mockRepository.removeLap.mockImplementation(({ id, lapId }) =>
        store.update(id, (sw) => markLapDeleted(sw, lapId, Date.now())),
      );
      mockRepository.undeleteLap.mockImplementation(({ id, lapId }) =>
        store.update(id, (sw) => restoreLap(sw, lapId)),
      );
    }

    it("shows the added lap and zeroes the split at once", async () => {
      stubLapWrites();
      load(createProject({ currentLapTime: 3000, laps: [LAP] }));
      const { result } = renderHook(() => useProject("test-id"));

      await act(() => result.current.addLap("2º Acabamento"));

      const { laps } = result.current.project.stopwatch;
      expect(laps.map((lap) => lap.name)).toEqual(["2º Acabamento", "1º Base"]);
      expect(result.current.splitDisplayTime).toBe(0);
      expect(result.current.displayTime).toBe(7000);
    });

    it("shows the first lap of a project that had none", async () => {
      stubLapWrites();
      load(createProject({ currentLapTime: 3000 }));
      const { result } = renderHook(() => useProject("test-id"));

      await act(() => result.current.addLap("1º Base"));

      expect(result.current.project.stopwatch.laps).toHaveLength(1);
    });

    it("hides a deleted lap and brings it back on undo", async () => {
      stubLapWrites();
      load(createProject({ laps: [LAP] }));
      const { result } = renderHook(() => useProject("test-id"));

      let undoer;
      await act(async () => {
        undoer = await result.current.deleteLap("lap-1");
      });
      expect(result.current.project.stopwatch.laps[0].deletedAt).toBeTruthy();

      await act(() => undoer.undo());
      expect(result.current.project.stopwatch.laps[0].deletedAt).toBeFalsy();
    });

    it("lets a newer live record win over the optimistic one", async () => {
      stubLapWrites();
      load(createProject({ laps: [LAP] }));
      const { result, rerender } = renderHook(() => useProject("test-id"));
      await act(() => result.current.addLap("2º Acabamento"));

      load(createProject({ laps: [{ ...LAP, name: "Vinda do sync" }] }));
      rerender();

      const { laps } = result.current.project.stopwatch;
      expect(laps.map((lap) => lap.name)).toEqual(["Vinda do sync"]);
    });

    it("keeps the live record when the repository writes nothing", async () => {
      mockRepository.addLap.mockResolvedValue(null);
      const project = createProject({ laps: [LAP] });
      load(project);
      const { result } = renderHook(() => useProject("test-id"));

      await act(() => result.current.addLap("Além do limite"));

      expect(result.current.project).toBe(project);
    });
  });
});
