import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import projectRepository, {
  DEFAULT_STOPWATCH,
} from "@/services/projectRepository.js";
import { calculateSplitTime, calculateTotalTime } from "@/lib/stopwatch.js";
import { useAutoPause } from "./useAutoPause.js";

const CHECKPOINT_INTERVAL = 10_000;

export function useProject(projectId) {
  const [displayTime, setDisplayTime] = useState(0);
  const [splitDisplayTime, setSplitDisplayTime] = useState(0);
  const recoveredRef = useRef(false);

  const project = useLiveQuery(
    () => projectRepository.getById(projectId),
    [projectId],
  );

  const isLoading = project === undefined;

  // Recovery: auto-pause abandoned timers on mount
  useEffect(() => {
    if (recoveredRef.current) return;
    if (!project) return;

    recoveredRef.current = true;

    if (!project.stopwatch?.isRunning) return;
    if (!project.stopwatch.lastActiveAt) return;

    const elapsed =
      project.stopwatch.lastActiveAt - project.stopwatch.startTimestamp;

    projectRepository.save({
      ...project,
      stopwatch: {
        ...project.stopwatch,
        isRunning: false,
        startTimestamp: null,
        lastActiveAt: null,
        currentLapTime: project.stopwatch.currentLapTime + elapsed,
      },
    });
  }, [project]);

  useEffect(() => {
    if (!project?.stopwatch?.isRunning) {
      if (project) {
        setDisplayTime(calculateTotalTime(project.stopwatch));
        setSplitDisplayTime(calculateSplitTime(project.stopwatch));
      }
      return;
    }

    let frameId;
    let lastCheckpoint = project.stopwatch.lastActiveAt ?? Date.now();

    const tick = () => {
      setDisplayTime(calculateTotalTime(project.stopwatch));
      setSplitDisplayTime(calculateSplitTime(project.stopwatch));

      const now = Date.now();
      if (now - lastCheckpoint >= CHECKPOINT_INTERVAL) {
        lastCheckpoint = now;
        projectRepository.save({
          ...project,
          stopwatch: { ...project.stopwatch, lastActiveAt: now },
        });
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [project]);

  useAutoPause(pause);

  function start() {
    const now = Date.now();
    projectRepository.save({
      ...project,
      stopwatch: {
        ...project.stopwatch,
        isRunning: true,
        startTimestamp: now,
        lastActiveAt: now,
      },
    });
  }

  function pause() {
    if (!project?.stopwatch?.isRunning) return;

    const elapsed = Date.now() - project.stopwatch.startTimestamp;

    projectRepository.save({
      ...project,
      stopwatch: {
        ...project.stopwatch,
        isRunning: false,
        startTimestamp: null,
        lastActiveAt: null,
        currentLapTime: project.stopwatch.currentLapTime + elapsed,
      },
    });
  }

  function reset() {
    projectRepository.save({
      ...project,
      stopwatch: { ...DEFAULT_STOPWATCH },
    });
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
    await projectRepository.remove(project.id);
  }

  async function renameLap(lapId, name) {
    await projectRepository.renameLap({ id: project.id, lapId, name });
  }

  async function deleteLap(lapId) {
    await projectRepository.removeLap({ id: project.id, lapId });
  }

  return {
    isLoading,
    project,
    displayTime,
    splitDisplayTime,
    start,
    pause,
    reset,
    toggle,
    addLap,
    rename,
    deleteProject,
    renameLap,
    deleteLap,
  };
}
