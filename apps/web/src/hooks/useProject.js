import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import projectRepository from "@/services/projectRepository.js";
import {
  calculateSplitTime,
  calculateTotalTime,
  isStopwatchStale,
} from "@/lib/stopwatch.js";
import {
  adjustCurrent,
  discardCurrent,
  heartbeat,
  pauseRun,
  recoverStaleRun,
  restoreDiscarded,
  startRun,
} from "@/lib/stopwatchTransitions.js";
import { useAutoPause } from "./useAutoPause.js";
import { useIgnoreMilliseconds } from "./useIgnoreMilliseconds.js";
import { useWakeLock } from "./useWakeLock.js";

const CHECKPOINT_INTERVAL = 10_000;

export function useProject(projectId) {
  const [displayTime, setDisplayTime] = useState(0);
  const [splitDisplayTime, setSplitDisplayTime] = useState(0);

  const [lapOverride, setLapOverride] = useState(null);

  const liveProject = useLiveQuery(
    () => projectRepository.getById(projectId),
    [projectId],
  );

  // A lap write resolves before useLiveQuery re-emits. Without the override
  // the add form closes on a list that lacks the new lap, and the lap pops in
  // a frame later. Any newer live stopwatch wins over it.
  const project = useMemo(() => {
    if (!lapOverride || liveProject?.stopwatch !== lapOverride.base) {
      return liveProject;
    }
    return { ...liveProject, stopwatch: lapOverride.next };
  }, [liveProject, lapOverride]);

  const isLoading = liveProject === undefined;
  // Read at write time: the delete undo runs from a toast, renders later.
  const liveStopwatchRef = useRef(null);
  liveStopwatchRef.current = liveProject?.stopwatch;

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

    if (isStopwatchStale(sw)) {
      projectRepository.updateStopwatch(project.id, (stored) =>
        recoverStaleRun(stored, Date.now()),
      );
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
        projectRepository.updateStopwatch(project.id, (stored) =>
          heartbeat(stored, now),
        );
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [project, ignoreMs]);

  useAutoPause(pause);
  useWakeLock(project?.stopwatch?.isRunning ?? false);

  // Reflect a stopwatch write in the display immediately, bridging the gap
  // until useLiveQuery re-emits — otherwise the old time flashes for a frame.
  function showStopwatch(sw) {
    setDisplayTime(calculateTotalTime(sw, { ignoreMs }));
    setSplitDisplayTime(calculateSplitTime(sw, { ignoreMs }));
  }

  async function writeLap(write) {
    const base = liveStopwatchRef.current;
    const change = await write();
    if (!change) return;
    setLapOverride({ base, next: change.next });
    showStopwatch(change.next);
  }

  function start() {
    projectRepository.updateStopwatch(project.id, (sw) =>
      startRun(sw, Date.now()),
    );
  }

  function pause() {
    if (!project?.stopwatch?.isRunning) return;
    projectRepository.updateStopwatch(project.id, (sw) =>
      pauseRun(sw, Date.now()),
    );
  }

  // The undo adds the discarded time back on top of the stored record, so a
  // run made before the undo is kept.
  async function discardCurrentTime() {
    const id = project.id;
    const now = Date.now();
    showStopwatch(discardCurrent(project.stopwatch, now));

    const change = await projectRepository.updateStopwatch(id, (sw) =>
      discardCurrent(sw, now),
    );
    const amount = change ? pauseRun(change.previous, now).currentLapTime : 0;

    return {
      undo: async () => {
        const restored = await projectRepository.updateStopwatch(id, (sw) =>
          restoreDiscarded(sw, amount),
        );
        if (restored) showStopwatch(restored.next);
      },
    };
  }

  // Commit an adjusted in-progress segment (clamped at 0). Called only while
  // paused (adjust mode pauses on entry) with the value confirmed in the UI.
  async function setCurrentTime(value) {
    const now = Date.now();
    showStopwatch(adjustCurrent(project.stopwatch, value, now));
    await projectRepository.updateStopwatch(project.id, (sw) =>
      adjustCurrent(sw, value, now),
    );
  }

  function toggle() {
    project?.stopwatch?.isRunning ? pause() : start();
  }

  async function rename(name) {
    if (!name) return;
    await projectRepository.rename({ id: project.id, newName: name });
  }

  async function addLap(name) {
    const id = project.id;
    await writeLap(() => projectRepository.addLap({ id, name }));
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
    await writeLap(() => projectRepository.removeLap({ id, lapId }));
    return {
      undo: () => writeLap(() => projectRepository.undeleteLap({ id, lapId })),
    };
  }

  return {
    isLoading,
    project,
    displayTime,
    splitDisplayTime,
    start,
    pause,
    discardCurrentTime,
    setCurrentTime,
    toggle,
    addLap,
    rename,
    deleteProject,
    renameLap,
    deleteLap,
  };
}
