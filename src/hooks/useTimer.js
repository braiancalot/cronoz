"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  calculateDisplayTime,
  DEFAULT_TIMER_STATE,
  loadTimerState,
  pauseTimer,
  resetTimer,
  saveTimerState,
  startTimer,
} from "@/lib/timer.js";

const TICK_INTERVAL = 16;

export function useTimer() {
  const [timerState, setTimerState] = useState(DEFAULT_TIMER_STATE);
  const [displayTime, setDisplayTime] = useState(0);
  const [mounted, setMounted] = useState(false);
  const stateRef = useRef(timerState);

  useEffect(() => {
    stateRef.current = timerState;
  }, [timerState]);

  useEffect(() => {
    setTimerState(loadTimerState()); // eslint-disable-line
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      saveTimerState(timerState);
    }
  }, [timerState, mounted]);

  useEffect(() => {
    if (!mounted) return;

    const tick = () => {
      setDisplayTime(calculateDisplayTime(timerState));
    };

    tick();

    if (timerState.isRunning) {
      const id = setInterval(tick, TICK_INTERVAL);
      return () => clearInterval(id);
    }
  }, [timerState, mounted]);

  const start = useCallback(() => {
    setTimerState((prev) => startTimer(prev));
  }, []);

  const pause = useCallback(() => {
    setTimerState((prev) => pauseTimer(prev));
  }, []);

  const reset = useCallback(() => {
    setTimerState(resetTimer());
  }, []);

  const toggle = useCallback(() => {
    setTimerState((prev) =>
      prev.isRunning ? pauseTimer(prev) : startTimer(prev),
    );
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (
        isMobile &&
        document.visibilityState === "hidden" &&
        stateRef.current.isRunning
      ) {
        setTimerState((prev) => pauseTimer(prev));
      }
    };

    const handleExit = () => {
      if (stateRef.current.isRunning) {
        setTimerState((prev) => pauseTimer(prev));
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handleExit);
    window.addEventListener("beforeunload", handleExit);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handleExit);
      window.removeEventListener("beforeunload", handleExit);
    };
  }, []);

  return {
    displayTime,
    isRunning: timerState.isRunning,
    mounted,
    start,
    pause,
    reset,
    toggle,
  };
}
