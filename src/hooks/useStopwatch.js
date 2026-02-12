"use client";

import { useCallback, useEffect, useState } from "react";

import projectRepository from "@/services/projectRepository.js";
import { useAutoPause } from "./useAutoPause.js";
import { calculateTime } from "@/lib/stopwatch.js";

export function useStopwatch(projectId) {
  const [project, setProject] = useState(null);
  const [displayTime, setDisplayTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    const data = projectRepository.getById(projectId);
    setProject(data); // eslint-disable-line
    setDisplayTime(calculateTime(data));

    setIsLoading(false);
  }, [projectId, setProject, setIsLoading]);

  useEffect(() => {
    if (!project?.isRunning) return;

    let frameId;

    const tick = () => {
      setDisplayTime(calculateTime(project));
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [project]);

  const updateProject = useCallback((data) => {
    setProject(data);
    projectRepository.save(data);
    setDisplayTime(calculateTime(data));
  }, []);

  const refresh = useCallback(() => {
    const data = projectRepository.getById(projectId);
    if (!data) return;

    setProject((current) => ({
      ...data,
      isRunning: current.isRunning,
      startTimestamp: current.startTimestamp,
      totalTime: current.totalTime,
    }));
  }, [projectId]);

  useAutoPause(pause);

  function start() {
    updateProject({ ...project, isRunning: true, startTimestamp: Date.now() });
  }

  function pause() {
    if (!project?.isRunning) return;

    const elapsed = Date.now() - project.startTimestamp;
    updateProject({
      ...project,
      isRunning: false,
      startTimestamp: null,
      totalTime: project.totalTime + elapsed,
    });
  }

  function reset() {
    updateProject({
      ...project,
      isRunning: false,
      startTimestamp: null,
      totalTime: 0,
    });
  }

  function toggle() {
    project?.isRunning ? pause() : start();
  }

  function rename(name) {
    if (!name) return;

    projectRepository.rename({ id: project.id, name });
    refresh();
  }

  function addLap() {
    if (!project?.isRunning) return;

    const elapsed = Date.now() - project.startTimestamp;
    const totalTime = project.totalTime + elapsed;

    projectRepository.addLap({ id: project.id, time: totalTime });
    refresh();
  }

  return {
    isLoading,
    project,
    displayTime,
    start,
    pause,
    reset,
    toggle,
    addLap,
    rename,
    refresh,
  };
}
