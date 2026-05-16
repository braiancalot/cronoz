import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";

import { useProject } from "@/hooks/useProject.js";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts.js";
import settingsRepository from "@/services/settingsRepository.js";

import { TimerControls } from "@/components/TimerControls.jsx";
import { TimerDisplay } from "@/components/TimerDisplay.jsx";
import { Laps } from "@/components/Laps.jsx";
import { ProjectHeader } from "@/components/ProjectHeader.jsx";
import { PageContainer } from "@/components/PageContainer.jsx";
import { ConfirmDialog } from "@/components/ConfirmDialog.jsx";

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);
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
    discardCurrentTime,
    renameLap,
    deleteLap,
  } = useProject(id);

  useKeyboardShortcuts({ onToggle: toggle });

  if (isLoading || isDeleting) return null;

  function handleStartAddLap() {
    pause();
    const lapNumber = (project.stopwatch.laps?.length ?? 0) + 1;
    setLapName(`${lapNumber}º `);
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

  function handleRequestDiscard() {
    setIsConfirmingDiscard(true);
  }

  function handleConfirmDiscard() {
    setIsConfirmingDiscard(false);
    discardCurrentTime();
  }

  if (!project) {
    return (
      <PageContainer className="items-center justify-center">
        <span>Projeto não encontrado.</span>
      </PageContainer>
    );
  }

  const hasLaps = project.stopwatch.laps?.length > 0;
  const canDiscardCurrentTime =
    project.stopwatch.isRunning || project.stopwatch.currentLapTime > 0;

  return (
    <PageContainer className="items-center justify-center">
      <ProjectHeader
        name={project.name}
        onRename={rename}
        onDelete={handleRequestDeleteProject}
        onDiscardCurrentTime={handleRequestDiscard}
        canDiscardCurrentTime={canDiscardCurrentTime}
      />

      <div
        onClick={project.stopwatch.isRunning ? pause : undefined}
        className="flex flex-1 flex-col w-full items-center"
      >
        <section className="flex flex-1 items-center justify-center w-full">
          <TimerDisplay
            time={hasLaps ? splitDisplayTime : displayTime}
            totalTime={hasLaps ? displayTime : null}
            isRunning={project.stopwatch.isRunning}
            hourlyPrice={hourlyPrice}
          />
        </section>

        {(hasLaps || isAddingLap) && (
          <Laps
            laps={project.stopwatch.laps}
            onRenameLap={renameLap}
            onDeleteLap={deleteLap}
            isAddingLap={isAddingLap}
            addLapName={lapName}
            onAddLapNameChange={setLapName}
            onConfirmAddLap={handleConfirmAddLap}
            onCancelAddLap={handleCancelAddLap}
          />
        )}

        <TimerControls
          isRunning={project.stopwatch.isRunning}
          hasLapTime={splitDisplayTime > 0}
          onStart={start}
          onPause={pause}
          onAddLap={handleStartAddLap}
        />
      </div>

      <ConfirmDialog
        open={isConfirmingDelete}
        title="Apagar projeto?"
        description={`"${project.name}" e todas as suas voltas serão removidas. Essa ação não pode ser desfeita.`}
        confirmLabel="Apagar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDeleteProject}
        onCancel={() => setIsConfirmingDelete(false)}
      />

      <ConfirmDialog
        open={isConfirmingDiscard}
        title="Descartar tempo atual?"
        description="O tempo em andamento será zerado. As voltas já registradas serão mantidas. Essa ação não pode ser desfeita."
        confirmLabel="Descartar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDiscard}
        onCancel={() => setIsConfirmingDiscard(false)}
      />
    </PageContainer>
  );
}
