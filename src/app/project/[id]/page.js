"use client";

import { use, useState } from "react";
import Link from "next/link.js";

import { useStopwatch } from "@/hooks/useStopwatch.js";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts.js";

import { TimerControls } from "@/components/TimerControls.jsx";
import { TimerDisplay } from "@/components/TimerDisplay.jsx";
import projectRepository from "@/services/projectRepository.js";

export default function ProjectPage({ params }) {
  const { id } = use(params);
  const [newName, setNewName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const { isLoading, project, displayTime, start, pause, reset, toggle } =
    useStopwatch(id);

  useKeyboardShortcuts({ onToggle: toggle });

  if (isLoading) return null;

  function handleRename() {
    if (!newName) return;
    projectRepository.rename({ id, name: newName });
    window.location.reload();
  }

  if (!project) {
    return (
      <main className="w-full h-dvh flex items-center justify-center">
        <span className="text-white">Projeto não encontrado.</span>
      </main>
    );
  }

  return (
    <main className="w-full h-dvh flex flex-col items-center justify-center px-8">
      <header className="w-full h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 justify-start">
          <Link href="/" className="text-lg">
            ←
          </Link>

          {isRenaming ? (
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              className="border border-teal-500 rounded text-white py-2 px-3"
            />
          ) : (
            <h1 className="text-lg font-medium">{project.name}</h1>
          )}
        </div>

        {isRenaming ? (
          <div className="flex gap-4">
            <button
              className="cursor-pointer"
              onClick={() => {
                setIsRenaming(false);
                setNewName("");
              }}
            >
              Cancelar
            </button>

            <button
              className="cursor-pointer"
              onClick={() => {
                handleRename();
                setIsRenaming(false);
                setNewName("");
              }}
            >
              Salvar
            </button>
          </div>
        ) : (
          <button
            className="cursor-pointer"
            onClick={() => {
              setNewName(project.name);
              setIsRenaming(true);
            }}
          >
            Renomear
          </button>
        )}
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
