"use client";

import { use, useState } from "react";
import Link from "next/link.js";
import { useRouter } from "next/navigation.js";
import { useLiveQuery } from "dexie-react-hooks";

import { useStopwatch } from "@/hooks/useStopwatch.js";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts.js";
import settingsRepository from "@/services/settingsRepository.js";

import { TimerControls } from "@/components/TimerControls.jsx";
import { TimerDisplay } from "@/components/TimerDisplay.jsx";
import { Laps } from "@/components/Laps.jsx";

export default function ProjectPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const hourlyPrice = useLiveQuery(
    () => settingsRepository.get("hourlyPrice"),
    [],
    10,
  );

  const {
    isLoading,
    project,
    displayTime,
    splitDisplayTime,
    start,
    pause,
    reset,
    toggle,
    addLap,
    rename,
    deleteProject,
    renameLap,
    deleteLap,
  } = useStopwatch(id);

  useKeyboardShortcuts({ onToggle: toggle });

  if (isLoading || isDeleting) return null;

  function handleStartRename() {
    setIsRenaming(true);
  }

  async function handleRename(event) {
    event.preventDefault();
    if (!newName) return;

    await rename(newName);
    setIsRenaming(false);
    setNewName("");
  }

  function handleCancel() {
    setIsRenaming(false);
    setNewName("");
  }

  async function handleDeleteProject() {
    setIsDeleting(true);
    await deleteProject();
    router.push("/");
  }

  if (!project) {
    return (
      <main className="w-full h-dvh flex items-center justify-center">
        <span className="text-white">Projeto não encontrado.</span>
      </main>
    );
  }

  const hasLaps = project.stopwatch.laps?.length > 0;

  return (
    <main className="w-full h-dvh flex flex-col items-center justify-center px-8">
      <header className="w-full h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 justify-start">
          <Link href="/" className="text-lg">
            ←
          </Link>

          {isRenaming ? (
            <form onSubmit={handleRename} className="w-auto">
              <input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                className="border border-teal-500 rounded text-white py-2 px-3 outline-none w-full"
                autoFocus
              />
            </form>
          ) : (
            <h1 className="text-lg font-medium">{project.name}</h1>
          )}
        </div>

        {isRenaming ? (
          <div className="flex gap-4">
            <button className="cursor-pointer text-sm" onClick={handleCancel}>
              Cancelar
            </button>
            <button className="cursor-pointer text-sm" onClick={handleRename}>
              Salvar
            </button>
          </div>
        ) : (
          <div className="flex gap-4">
            <button
              className="cursor-pointer text-sm"
              onClick={handleStartRename}
            >
              Renomear
            </button>

            <button
              className="cursor-pointer text-sm text-red-400 hover:text-red-300"
              onClick={handleDeleteProject}
            >
              Deletar
            </button>
          </div>
        )}
      </header>

      <section className="flex flex-1 items-center justify-center">
        <TimerDisplay
          time={hasLaps ? splitDisplayTime : displayTime}
          totalTime={hasLaps ? displayTime : null}
          isRunning={project.stopwatch.isRunning}
          hourlyPrice={hourlyPrice}
        />
      </section>

      {hasLaps && (
        <Laps
          laps={project.stopwatch.laps}
          onRenameLap={renameLap}
          onDeleteLap={deleteLap}
        />
      )}

      <TimerControls
        isRunning={project.stopwatch.isRunning}
        hasTime={displayTime > 0}
        onStart={start}
        onPause={pause}
        onReset={reset}
        onAddLap={addLap}
      />
    </main>
  );
}
