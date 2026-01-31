"use client";

import { use } from "react";
import Link from "next/link.js";

import { useStopwatch } from "@/hooks/useStopwatch.js";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts.js";

import { TimerControls } from "@/components/TimerControls.jsx";
import { TimerDisplay } from "@/components/TimerDisplay.jsx";

export default function ProjectPage({ params }) {
  const { id } = use(params);

  const { isLoading, project, displayTime, start, pause, reset, toggle } =
    useStopwatch(id);

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
    <main className="w-full h-dvh flex flex-col items-center justify-center px-8">
      <header className="w-full flex items-center h-16 justify-start gap-4">
        <Link href="/" className="text-lg">
          ←
        </Link>

        <h1 className="text-lg font-medium">
          {isLoading ? "Carregando..." : project?.name}
        </h1>
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
