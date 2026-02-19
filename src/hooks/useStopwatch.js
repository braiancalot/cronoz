"use client";

import { useCallback, useEffect, useState } from "react";

import projectRepository, {
  DEFAULT_STOPWATCH,
} from "@/services/projectRepository.js";
import { calculateSplitTime, calculateTotalTime } from "@/lib/stopwatch.js";
import { useAutoPause } from "./useAutoPause.js";

export function useStopwatch(projectId) {
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [displayTime, setDisplayTime] = useState(0);
  const [splitDisplayTime, setSplitDisplayTime] = useState(0);

  useEffect(() => {
    if (!projectId) return;

    (async () => {
      const data = await projectRepository.getById(projectId);
      setProject(data);
      setIsLoading(false);
    })();
  }, [projectId]);

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

  const updateProject = useCallback((data) => {
    setProject(data);
    projectRepository.save(data);
  }, []);

  async function refresh() {
    const updated = await projectRepository.getById(projectId);
    setProject(updated);
  }

  useAutoPause(pause);

  function start() {
    updateProject({
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

    updateProject({
      ...project,
      stopwatch: {
        ...project.stopwatch,
        isRunning: false,
        startTimestamp: null,
        totalTime: project.stopwatch.totalTime + elapsed,
      },
    });
  }

  function reset() {
    updateProject({
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
    setProject((p) => ({ ...p, name }));
  }

  async function addLap() {
    if (!project?.stopwatch?.isRunning) return;

    const elapsed = Date.now() - project.stopwatch.startTimestamp;
    const totalTime = project.stopwatch.totalTime + elapsed;

    await projectRepository.addLap({ id: project.id, totalTime });
    await refresh();
  }

  async function deleteProject() {
    await projectRepository.remove(project.id);
  }

  async function completeProject() {
    await projectRepository.complete(project.id);
    await refresh();
  }

  async function reopenProject() {
    await projectRepository.reopen(project.id);
    await refresh();
  }

  async function renameLap(lapId, name) {
    await projectRepository.renameLap({ id: project.id, lapId, name });
    await refresh();
  }

  async function deleteLap(lapId) {
    await projectRepository.removeLap({ id: project.id, lapId });
    await refresh();
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
    completeProject,
    reopenProject,
    renameLap,
    deleteLap,
  };
}
