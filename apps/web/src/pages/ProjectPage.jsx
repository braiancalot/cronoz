import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";

import { useProject } from "@/hooks/useProject.js";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts.js";
import settingsRepository from "@/services/settingsRepository.js";

import { TimerControls } from "@/components/TimerControls.jsx";
import { TimerDisplay } from "@/components/TimerDisplay.jsx";
import { Laps } from "@/components/Laps.jsx";
import { LapModal } from "@/components/LapModal.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [newName, setNewName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingLap, setIsAddingLap] = useState(false);
  const [lapName, setLapName] = useState("");

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
    toggle,
    addLap,
    rename,
    deleteProject,
    renameLap,
    deleteLap,
  } = useProject(id);

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

  function handleStartAddLap() {
    pause();
    const lapNumber = (project.stopwatch.laps?.length ?? 0) + 1;
    setLapName(`Etapa #${lapNumber}`);
    setIsAddingLap(true);
  }

  async function handleConfirmAddLap() {
    if (!lapName) return;

    await addLap(lapName);
    setIsAddingLap(false);
    setLapName("");
  }

  function handleCancelAddLap() {
    setIsAddingLap(false);
    setLapName("");
  }

  async function handleDeleteProject() {
    setIsDeleting(true);
    await deleteProject();
    navigate("/");
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
          <Link to="/" className="text-lg">
            ←
          </Link>

          {isRenaming ? (
            <form onSubmit={handleRename} className="w-auto">
              <Input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                autoFocus
              />
            </form>
          ) : (
            <h1 className="text-lg font-medium">{project.name}</h1>
          )}
        </div>

        {isRenaming ? (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRename}>
              Salvar
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleStartRename}>
              Renomear
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteProject}
            >
              Deletar
            </Button>
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

      <LapModal
        open={isAddingLap}
        lapName={lapName}
        onLapNameChange={setLapName}
        onConfirm={handleConfirmAddLap}
        onCancel={handleCancelAddLap}
      />

      <TimerControls
        isRunning={project.stopwatch.isRunning}
        hasLapTime={splitDisplayTime > 0}
        onStart={start}
        onPause={pause}
        onAddLap={handleStartAddLap}
      />
    </main>
  );
}
