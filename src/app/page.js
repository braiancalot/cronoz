"use client";

import { useStopwatch } from "@/hooks/useStopwatch.js";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts.js";

import { TimerControls } from "@/components/TimerControls.jsx";
import { TimerDisplay } from "@/components/TimerDisplay.jsx";

export default function Home() {
  const { isLoading, project, displayTime, start, pause, reset, toggle } =
    useStopwatch("8f2a6bda-c6b6-40c1-8667-28c4364980a2");

  useKeyboardShortcuts({ onToggle: toggle });

  if (isLoading) return null;

  if (!project) {
    return (
      <main className="w-full h-dvh flex items-center justify-center">
        <span className="text-white">Projeto não encontrado.</span>
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
        isRunning={project.isRunning}
        hasTime={displayTime > 0}
        onStart={start}
        onPause={pause}
        onReset={reset}
      />
    </main>
  );
}
