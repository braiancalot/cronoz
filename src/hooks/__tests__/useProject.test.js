import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { DEFAULT_STOPWATCH } from "@/services/projectRepository.js";

// vi.hoisted runs before vi.mock hoisting, making these available to factories
const { mockUseLiveQuery, mockRepository } = vi.hoisted(() => ({
  mockUseLiveQuery: vi.fn(),
  mockRepository: {
    getById: vi.fn(),
    save: vi.fn(),
    rename: vi.fn(),
    remove: vi.fn(),
    addLap: vi.fn(),
    renameLap: vi.fn(),
    removeLap: vi.fn(),
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

  it("start saves project with isRunning true", () => {
    const project = createProject();
    mockUseLiveQuery.mockReturnValue(project);

    const { result } = renderHook(() => useProject("test-id"));

    act(() => {
      result.current.start();
    });

    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        stopwatch: expect.objectContaining({
          isRunning: true,
          startTimestamp: expect.any(Number),
        }),
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

    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        stopwatch: expect.objectContaining({
          isRunning: false,
          startTimestamp: null,
          currentLapTime: 5000, // 2000 + (10000 - 7000)
        }),
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

    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it("reset saves project with DEFAULT_STOPWATCH", () => {
    const project = createProject({ currentLapTime: 5000 });
    mockUseLiveQuery.mockReturnValue(project);

    const { result } = renderHook(() => useProject("test-id"));

    act(() => {
      result.current.reset();
    });

    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        stopwatch: DEFAULT_STOPWATCH,
      }),
    );
  });

  it("toggle calls start when stopped", () => {
    const project = createProject({ isRunning: false });
    mockUseLiveQuery.mockReturnValue(project);

    const { result } = renderHook(() => useProject("test-id"));

    act(() => {
      result.current.toggle();
    });

    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        stopwatch: expect.objectContaining({ isRunning: true }),
      }),
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

    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        stopwatch: expect.objectContaining({ isRunning: false }),
      }),
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
      result.current.addLap("Etapa #1");
    });

    expect(mockRepository.addLap).toHaveBeenCalledWith({
      id: "test-id",
      lapTime: 5000, // currentLapTime (2000) + elapsed (10000 - 7000)
      name: "Etapa #1",
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
      result.current.addLap("Etapa #1");
    });

    expect(mockRepository.addLap).toHaveBeenCalledWith({
      id: "test-id",
      lapTime: 5000,
      name: "Etapa #1",
    });

    // Must NOT call save — that was the bug (start() called save with stale state)
    expect(mockRepository.save).not.toHaveBeenCalled();
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
});
