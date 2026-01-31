"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import projectRepository from "@/services/projectRepository.js";

function calculateTime(project) {
  if (!project) return 0;

  const { isRunning, startTimestamp, totalTime } = project;
  if (isRunning && startTimestamp) {
    return totalTime + (Date.now() - startTimestamp);
  }

  return totalTime;
}

export function useStopwatch(projectId) {
  const [project, setProject] = useState(null);
  const [displayTime, setDisplayTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const projectRef = useRef(project);

  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  useEffect(() => {
    if (!projectId) return;

    const data = projectRepository.getById(projectId);
    setProject(data); // eslint-disable-line
    projectRef.current = data;
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

  //   useEffect(() => {
  //     const handleVisibilityChange = () => {
  //       const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  //       if (
  //         isMobile &&
  //         document.visibilityState === "hidden" &&
  //         stateRef.current.isRunning
  //       ) {
  //         setTimerState((prev) => pauseTimer(prev));
  //       }
  //     };

  //     const handleExit = () => {
  //       if (stateRef.current.isRunning) {
  //         setTimerState((prev) => pauseTimer(prev));
  //       }
  //     };

  //     document.addEventListener("visibilitychange", handleVisibilityChange);
  //     window.addEventListener("pagehide", handleExit);
  //     window.addEventListener("beforeunload", handleExit);

  //     return () => {
  //       document.removeEventListener("visibilitychange", handleVisibilityChange);
  //       window.removeEventListener("pagehide", handleExit);
  //       window.removeEventListener("beforeunload", handleExit);
  //     };
  //   }, []);

  return {
    isLoading,
    project,
    displayTime,
    start,
    pause,
    reset,
    toggle,
  };
}
