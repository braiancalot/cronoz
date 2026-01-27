"use client";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts.js";
import { useTimer } from "@/hooks/useTimer.js";

import { TimerControls } from "@/components/TimerControls.jsx";
import { TimerDisplay } from "@/components/TimerDisplay.jsx";

export default function Home() {
  const { displayTime, isRunning, mounted, start, pause, reset, toggle } =
    useTimer();

  useKeyboardShortcuts({ onToggle: toggle });

  if (!mounted) {
    return (
      <main className="w-full h-dvh flex items-center justify-center">
        <span className="text-neutral-500">Carregando...</span>
      </main>
    );
  }

  return (
    <main className="w-full h-dvh flex flex-col items-center justify-center">
      <header className="flex h-16 items-center justify-center">
        <h1 className="text-lg font-bold tracking-tight">Cronoz</h1>
      </header>

      <section className="flex flex-1 items-center justify-center">
        <TimerDisplay time={displayTime} />
      </section>

      <TimerControls
        isRunning={isRunning}
        hasTime={displayTime > 0}
        onStart={start}
        onPause={pause}
        onReset={reset}
      />
    </main>
  );
}
