"use client";

import { useEffect, useRef, useState } from "react";

function formatTime(timer) {
  const hours = Math.floor(timer / 3600000)
    .toString()
    .padStart(2, "0");

  const minutes = Math.floor((timer / 60000) % 60)
    .toString()
    .padStart(2, "0");

  const seconds = Math.floor((timer / 1000) % 60)
    .toString()
    .padStart(2, "0");

  const milliseconds = Math.floor((timer % 1000) / 10)
    .toString()
    .padStart(2, "0");

  return { hours, minutes, seconds, milliseconds };
}

export default function Home() {
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const timerInterval = useRef(null);

  useEffect(() => {
    return () => clearInterval(timerInterval.current);
  }, []);

  function handleStart() {
    if (isRunning) return;

    setIsRunning(true);
    timerInterval.current = setInterval(() => {
      setTimer((prev) => prev + 10);
    }, 10);
  }

  function handlePause() {
    setIsRunning(false);
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  }

  function handleReset() {
    handlePause();
    setTimer(0);
  }

  const { hours, minutes, seconds, milliseconds } = formatTime(timer);

  return (
    <main className="w-full h-svh flex flex-col items-center justify-center gap-10">
      <div className="flex gap-1 text-3xl font-medium">
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
      </div>

      <div className="flex gap-4">
        <button
          className="px-3 py-1 border border-red-600 hover:bg-neutral-900 active:bg-red-600 text-white rounded active:scale-95 text-sm"
          onClick={handleReset}
        >
          Reset
        </button>

        <button
          className="px-3 py-1 border border-yellow-600 hover:bg-neutral-900 active:bg-yellow-600 text-white rounded active:scale-95 text-sm"
          onClick={handlePause}
        >
          Pause
        </button>

        <button
          className="px-3 py-1 border border-green-600 hover:bg-neutral-900 active:bg-green-600 text-white rounded active:scale-95 text-sm"
          onClick={handleStart}
        >
          Start
        </button>
      </div>
    </main>
  );
}
