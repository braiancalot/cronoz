import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import projectRepository, {
  DEFAULT_STOPWATCH,
} from "@/services/projectRepository.js";
import { calculateSplitTime, calculateTotalTime } from "@/lib/stopwatch.js";
import { useAutoPause } from "./useAutoPause.js";
import { useIgnoreMilliseconds } from "./useIgnoreMilliseconds.js";
import { useWakeLock } from "./useWakeLock.js";

const CHECKPOINT_INTERVAL = 10_000;

// A fresh checkpoint within this window means another device (or a recent
// same-device session) may still be alive — skip recovery to avoid pausing
// a remote run. Must be > CHECKPOINT_INTERVAL + sync debounce + slack.
const RECOVERY_GRACE_PERIOD = 30_000;

export function useProject(projectId) {
  const [displayTime, setDisplayTime] = useState(0);
  const [splitDisplayTime, setSplitDisplayTime] = useState(0);

  const project = useLiveQuery(
    () => projectRepository.getById(projectId),
    [projectId],
  );

  const isLoading = project === undefined;

  const ignoreMs = useIgnoreMilliseconds();

  // Recovery + checkpoint live in a single effect to avoid a race: if recovery
  // is in another effect, the checkpoint loop can fire a stale write before
  // the recovery's pause commits, undoing it.
  //
  // Recovery uses lastActiveAt as a liveness signal — stale heartbeat means
  // the run was abandoned. The staleness check itself is the guard: if the
  // user just started the timer or the checkpoint just wrote, lastActiveAt
  // is fresh and no pause fires. So this can run on every render without a
  // one-shot ref — important so a sync pull that brings a stale running
  // stopwatch after the initial render still triggers recovery.
  useEffect(() => {
    if (!project) return;

    const sw = project.stopwatch;
    const isStale =
      sw?.isRunning &&
      sw.lastActiveAt &&
      Date.now() - sw.lastActiveAt >= RECOVERY_GRACE_PERIOD;

    if (isStale) {
      const elapsed = sw.lastActiveAt - sw.startTimestamp;
      projectRepository.setStopwatch(project.id, {
        ...sw,
        isRunning: false,
        startTimestamp: null,
        lastActiveAt: null,
        currentLapTime: sw.currentLapTime + elapsed,
      });
      // Don't start the checkpoint loop — useLiveQuery will fire again
      // with the paused state and this effect will re-run.
      return;
    }

    if (!project.stopwatch?.isRunning) {
      setDisplayTime(calculateTotalTime(project.stopwatch, { ignoreMs }));
      setSplitDisplayTime(calculateSplitTime(project.stopwatch, { ignoreMs }));
      return;
    }

    let frameId;
    let lastCheckpoint = project.stopwatch.lastActiveAt ?? Date.now();

    const tick = () => {
      setDisplayTime(calculateTotalTime(project.stopwatch, { ignoreMs }));
      setSplitDisplayTime(calculateSplitTime(project.stopwatch, { ignoreMs }));

      const now = Date.now();
      if (now - lastCheckpoint >= CHECKPOINT_INTERVAL) {
        lastCheckpoint = now;
        projectRepository.setStopwatch(project.id, {
          ...project.stopwatch,
          lastActiveAt: now,
        });
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [project, ignoreMs]);

  useAutoPause(pause);
  useWakeLock(project?.stopwatch?.isRunning ?? false);

  function start() {
    const now = Date.now();
    projectRepository.setStopwatch(project.id, {
      ...project.stopwatch,
      isRunning: true,
      startTimestamp: now,
      lastActiveAt: now,
    });
  }

  function pause() {
    if (!project?.stopwatch?.isRunning) return;

    const elapsed = Date.now() - project.stopwatch.startTimestamp;

    projectRepository.setStopwatch(project.id, {
      ...project.stopwatch,
      isRunning: false,
      startTimestamp: null,
      lastActiveAt: null,
      currentLapTime: project.stopwatch.currentLapTime + elapsed,
    });
  }

  function reset() {
    const snapshot = { ...project.stopwatch };
    projectRepository.setStopwatch(project.id, { ...DEFAULT_STOPWATCH });
    return {
      undo: () =>
        projectRepository.setStopwatch(project.id, {
          ...snapshot,
          isRunning: false,
          startTimestamp: null,
          lastActiveAt: null,
        }),
    };
  }

  function discardCurrentTime() {
    const snapshot = { ...project.stopwatch };
    projectRepository.setStopwatch(project.id, {
      ...project.stopwatch,
      isRunning: false,
      startTimestamp: null,
      lastActiveAt: null,
      currentLapTime: 0,
    });
    return {
      undo: () =>
        projectRepository.setStopwatch(project.id, {
          ...snapshot,
          isRunning: false,
          startTimestamp: null,
          lastActiveAt: null,
        }),
    };
  }

  function toggle() {
    project?.stopwatch?.isRunning ? pause() : start();
  }

  async function rename(name) {
    if (!name) return;
    await projectRepository.rename({ id: project.id, newName: name });
  }

  async function addLap(name) {
    const elapsed = project.stopwatch.startTimestamp
      ? Date.now() - project.stopwatch.startTimestamp
      : 0;
    const lapTime = project.stopwatch.currentLapTime + elapsed;

    await projectRepository.addLap({ id: project.id, lapTime, name });
  }

  async function deleteProject() {
    const id = project.id;
    await projectRepository.remove(id);
    return { undo: () => projectRepository.undeleteProject(id) };
  }

  async function renameLap(lapId, name) {
    await projectRepository.renameLap({ id: project.id, lapId, name });
  }

  async function deleteLap(lapId) {
    const id = project.id;
    await projectRepository.removeLap({ id, lapId });
    return { undo: () => projectRepository.undeleteLap({ id, lapId }) };
  }

  return {
    isLoading,
    project,
    displayTime,
    splitDisplayTime,
    start,
    pause,
    reset,
    discardCurrentTime,
    toggle,
    addLap,
    rename,
    deleteProject,
    renameLap,
    deleteLap,
  };
}
