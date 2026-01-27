"use client";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts.js";
import { useTimer } from "@/hooks/useTimer.js";
import { formatTime } from "@/lib/timer.js";

export default function Home() {
  const { displayTime, isRunning, mounted, start, pause, reset, toggle } =
    useTimer();

  useKeyboardShortcuts({ onToggle: toggle });

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
          onClick={reset}
        >
          Reset
        </button>

        <button
          className="flex-1 px-3 py-2 border border-yellow-600 hover:bg-neutral-900 active:bg-yellow-600 text-white rounded active:scale-95 text-sm"
          onClick={pause}
        >
          Pause
        </button>

        <button
          className="flex-1 px-3 py-2 border border-green-600 hover:bg-neutral-900 active:bg-green-600 text-white rounded active:scale-95 text-sm transition-all"
          onClick={start}
        >
          Start
        </button>
      </div>
    </main>
  );
}
