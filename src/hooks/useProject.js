"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import projectRepository, {
  DEFAULT_STOPWATCH,
} from "@/services/projectRepository.js";
import { calculateSplitTime, calculateTotalTime } from "@/lib/stopwatch.js";
import { useAutoPause } from "./useAutoPause.js";

export function useProject(projectId) {
  const [displayTime, setDisplayTime] = useState(0);
  const [splitDisplayTime, setSplitDisplayTime] = useState(0);

  const project = useLiveQuery(
    () => projectRepository.getById(projectId),
    [projectId],
  );

  const isLoading = project === undefined;

  useEffect(() => {
    if (!project?.stopwatch?.isRunning) {
      if (project) {
        setDisplayTime(calculateTotalTime(project.stopwatch)); // eslint-disable-line
        setSplitDisplayTime(calculateSplitTime(project.stopwatch));
      }
      return;
    }

    let frameId;

    const tick = () => {
      setDisplayTime(calculateTotalTime(project.stopwatch));
      setSplitDisplayTime(calculateSplitTime(project.stopwatch));
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [project]);

  useAutoPause(pause);

  function start() {
    projectRepository.save({
      ...project,
      stopwatch: {
        ...project.stopwatch,
        isRunning: true,
        startTimestamp: Date.now(),
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
