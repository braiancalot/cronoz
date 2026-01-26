"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cronoz-stopwatch-state";

const DEFAULT_STATE = {
  startTimestamp: null,
  accumulatedTime: 0,
  isRunning: false,
};

function formatTime(ms) {
  const hours = Math.floor(ms / 3600000)
    .toString()
    .padStart(2, "0");

  const minutes = Math.floor((ms / 60000) % 60)
    .toString()
    .padStart(2, "0");

  const seconds = Math.floor((ms / 1000) % 60)
    .toString()
    .padStart(2, "0");

  const milliseconds = Math.floor((ms % 1000) / 10)
    .toString()
    .padStart(2, "0");

  return { hours, minutes, seconds, milliseconds };
}

export default function Home() {
  const [timerState, setTimerState] = useState(DEFAULT_STATE);
  const [displayTime, setDisplayTime] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setTimerState(JSON.parse(saved)); // eslint-disable-line
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(timerState));
    }
  }, [timerState, mounted]);

  useEffect(() => {
    if (!mounted) return;

    const tick = () => {
      const { isRunning, startTimestamp, accumulatedTime } = timerState;

      const now =
        isRunning && startTimestamp
          ? accumulatedTime + (Date.now() - startTimestamp)
          : accumulatedTime;

      setDisplayTime(now);
    };

    tick();

    if (timerState.isRunning) {
      const id = setInterval(tick, 16);
      return () => clearInterval(id);
    }
  }, [timerState, mounted]);

  const handleStart = useCallback(() => {
    if (timerState.isRunning) return;

    setTimerState((prev) => ({
      ...prev,
      startTimestamp: Date.now(),
      isRunning: true,
    }));
  }, [timerState]);

  const handlePause = useCallback(() => {
    if (!timerState.isRunning || !timerState.startTimestamp) return;

    const elapsed = Date.now() - timerState.startTimestamp;
    setTimerState((prev) => ({
      startTimestamp: null,
      accumulatedTime: prev.accumulatedTime + elapsed,
      isRunning: false,
    }));
  }, [timerState.isRunning, timerState.startTimestamp]);

  const handleReset = useCallback(() => {
    setTimerState(DEFAULT_STATE);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (
        isMobile &&
        document.visibilityState === "hidden" &&
        timerState.isRunning
      ) {
        handlePause();
      }
    };

    const handleExit = () => {
      if (timerState.isRunning) handlePause();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handleExit);
    window.addEventListener("beforeunload", handleExit);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handleExit);
      window.removeEventListener("beforeunload", handleExit);
    };
  }, [timerState.isRunning, handlePause]);

  if (!mounted)
    return (
      <main className="w-full h-dvh flex items-center justify-center">
        Carregando...
      </main>
    );

  const { hours, minutes, seconds, milliseconds } = formatTime(displayTime);

  return (
    <main className="w-full h-dvh flex flex-col items-center justify-center gap-10">
      <header className="flex h-16 items-center justify-center">
        <h1 className="text-lg font-bold tracking-tight">Cronoz</h1>
      </header>

      <section className="flex flex-1 text-6xl font-medium items-center justify-center">
        {hours !== "00" && (
          <>
            <span>{hours}</span>
            <span>:</span>
          </>
        )}

        <span>{minutes}</span>
        <span>:</span>
        <span>{seconds}</span>
        <span>.</span>
        <span>{milliseconds}</span>
      </section>

      <div className="flex w-full p-4 gap-4">
        <button
          className="flex-1 px-3 py-2 border border-red-600 hover:bg-neutral-900 active:bg-red-600 text-white rounded active:scale-95 text-sm"
          onClick={handleReset}
        >
          Reset
        </button>

        <button
          className="flex-1 px-3 py-2 border border-yellow-600 hover:bg-neutral-900 active:bg-yellow-600 text-white rounded active:scale-95 text-sm"
          onClick={handlePause}
        >
          Pause
        </button>

        <button
          className="flex-1 px-3 py-2 border border-green-600 hover:bg-neutral-900 active:bg-green-600 text-white rounded active:scale-95 text-sm transition-all"
          onClick={handleStart}
        >
          Start
        </button>
      </div>
    </main>
  );
}
