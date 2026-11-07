import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  const [, setShownTimes] = useState("");
  const [stopwatchOverride, setStopwatchOverride] = useState(null);

  const liveProject = useLiveQuery(
    () => projectRepository.getById(projectId),
    [projectId],
  );

  // A write resolves before useLiveQuery re-emits. Without the override the
  // add form closed on a list that lacked the new lap, and play/pause reacted
  // a frame late. Any newer live stopwatch wins over it.
  const project = useMemo(() => {
    if (
      !stopwatchOverride ||
      liveProject?.stopwatch !== stopwatchOverride.base
    ) {
      return liveProject;
    }
    return { ...liveProject, stopwatch: stopwatchOverride.next };
  }, [liveProject, stopwatchOverride]);

  const isLoading = liveProject === undefined;
  // Read at write time: the delete undo runs from a toast, renders later.
  const liveStopwatchRef = useRef(null);
  useLayoutEffect(() => {
    liveStopwatchRef.current = liveProject?.stopwatch;
  }, [liveProject]);

  const ignoreMs = useIgnoreMilliseconds();
  const displayTime = calculateTotalTime(project?.stopwatch, { ignoreMs });
  const splitDisplayTime = calculateSplitTime(project?.stopwatch, { ignoreMs });

  // Recovery + checkpoint live in a single effect to avoid a race: if recovery
  // is in another effect, the checkpoint loop can fire a stale write before
  // the recovery's pause commits, undoing it.
  //
  // Recovery uses lastActiveAt as a liveness signal: a stale heartbeat means
  // the run was abandoned. The staleness check itself is the guard: if the
  // user just started the timer or the checkpoint just wrote, lastActiveAt
  // is fresh and no pause fires. So this can run on every render without a
  // one-shot ref, which matters so a sync pull that brings a stale running
  // stopwatch after the initial render still triggers recovery.
  useEffect(() => {
    if (!project) return;

    const stopwatch = project.stopwatch;

    if (isStopwatchStale(stopwatch)) {
      projectRepository.updateStopwatch(project.id, (stored) =>
        recoverStaleRun(stored, Date.now()),
      );
      // Don't start the checkpoint loop: useLiveQuery will fire again
      // with the paused state and this effect will re-run.
      return;
    }

    if (!project.stopwatch?.isRunning) return;

    let frameId;
    let lastCheckpoint = project.stopwatch.lastActiveAt ?? Date.now();

    const tick = () => {
      // A key of both shown values, so React skips frames that change neither.
      setShownTimes(
        `${calculateTotalTime(project.stopwatch, { ignoreMs })}:${calculateSplitTime(project.stopwatch, { ignoreMs })}`,
      );

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

  // For writes whose result only the repository knows, like a minted lap id.
  async function holdAfterWrite(write) {
    const base = liveStopwatchRef.current;
    const change = await write();
    if (change) setStopwatchOverride({ base, next: change.next });
  }

  // Same `now` on both sides, so the live record lands on the shown value.
  function runTransition(transition, now = Date.now()) {
    setStopwatchOverride({
      base: liveStopwatchRef.current,
      next: transition(project.stopwatch, now),
    });
    return projectRepository.updateStopwatch(project.id, (stopwatch) =>
      transition(stopwatch, now),
    );
  }

  function start() {
    runTransition(startRun);
  }

  function pause() {
    if (!project?.stopwatch?.isRunning) return;
    runTransition(pauseRun);
  }

  // The undo adds the discarded time back on top of the stored record, so a
  // run made before the undo is kept.
  async function discardCurrentTime() {
    const id = project.id;
    const now = Date.now();
    const change = await runTransition(discardCurrent, now);
    const amount = change ? pauseRun(change.previous, now).currentLapTime : 0;

    return {
      undo: () =>
        holdAfterWrite(() =>
          projectRepository.updateStopwatch(id, (stopwatch) =>
            restoreDiscarded(stopwatch, amount),
          ),
        ),
    };
  }

  // Commit an adjusted in-progress segment (clamped at 0). Called only while
  // paused (adjust mode pauses on entry) with the value confirmed in the UI.
  async function setCurrentTime(value) {
    await runTransition((stopwatch, now) =>
      adjustCurrent(stopwatch, value, now),
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
    await holdAfterWrite(() => projectRepository.addLap({ id, name }));
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
    await holdAfterWrite(() => projectRepository.removeLap({ id, lapId }));
    return {
      undo: () =>
        holdAfterWrite(() => projectRepository.undeleteLap({ id, lapId })),
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
