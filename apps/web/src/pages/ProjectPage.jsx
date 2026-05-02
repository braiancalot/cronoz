import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";

import { useProject } from "@/hooks/useProject.js";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts.js";
import settingsRepository from "@/services/settingsRepository.js";

import { TimerControls } from "@/components/TimerControls.jsx";
import { TimerDisplay } from "@/components/TimerDisplay.jsx";
import { Laps } from "@/components/Laps.jsx";
import { LapModal } from "@/components/LapModal.jsx";
import { ProjectHeader } from "@/components/ProjectHeader.jsx";
import { PageContainer } from "@/components/PageContainer.jsx";
import { ConfirmDialog } from "@/components/ConfirmDialog.jsx";

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
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

  function handleRequestDeleteProject() {
    setIsConfirmingDelete(true);
  }

  async function handleConfirmDeleteProject() {
    setIsConfirmingDelete(false);
    setIsDeleting(true);
    await deleteProject();
    navigate("/");
  }

  if (!project) {
    return (
      <PageContainer className="items-center justify-center">
        <span>Projeto não encontrado.</span>
      </PageContainer>
    );
  }

  const hasLaps = project.stopwatch.laps?.length > 0;

  return (
    <PageContainer className="items-center justify-center">
      <ProjectHeader
        name={project.name}
        onRename={rename}
        onDelete={handleRequestDeleteProject}
      />

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

      <ConfirmDialog
        open={isConfirmingDelete}
        title="Apagar projeto?"
        description={`"${project.name}" e todas as suas etapas serão removidos. Essa ação não pode ser desfeita.`}
        confirmLabel="Apagar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDeleteProject}
        onCancel={() => setIsConfirmingDelete(false)}
      />
    </PageContainer>
  );
}
