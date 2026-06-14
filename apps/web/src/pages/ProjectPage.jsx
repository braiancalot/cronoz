import { useState } from "react";
import { useNavigate, useParams } from "react-router";

import { useProject } from "@/hooks/useProject.js";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts.js";
import { useHourlyPrice } from "@/providers/SettingsProvider.jsx";

import { ArrowLeftIcon } from "lucide-react";

import { usePiPWindow } from "@/hooks/usePiPWindow.js";
import { TimerControls } from "@/components/TimerControls.jsx";
import { TimerDisplay } from "@/components/TimerDisplay.jsx";
import { PiPTimer } from "@/components/PiPTimer.jsx";
import { Laps } from "@/components/Laps.jsx";
import { ProjectHeader } from "@/components/ProjectHeader.jsx";
import { PageContainer } from "@/components/PageContainer.jsx";
import { ConfirmDialog } from "@/components/ConfirmDialog.jsx";
import { EmptyState } from "@/components/EmptyState.jsx";
import { Button } from "@/components/ui/button.jsx";
import { showUndoToast } from "@/lib/undoToast.js";

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [isAddingLap, setIsAddingLap] = useState(false);
  const [lapName, setLapName] = useState("");

  const hourlyPrice = useHourlyPrice();

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
    reset,
    renameLap,
    deleteLap,
  } = useProject(id);

  useKeyboardShortcuts({ onToggle: toggle });

  const { isSupported: isPiPSupported, pipWindow, openPiP } = usePiPWindow();

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
    const projectName = project.name;
    const { undo } = await deleteProject();
    navigate("/");
    showUndoToast(`Projeto "${projectName}" excluído`, undo);
  }

  function handleRequestDiscard() {
    setIsConfirmingDiscard(true);
  }

  function handleConfirmDiscard() {
    setIsConfirmingDiscard(false);
    const { undo } = discardCurrentTime();
    showUndoToast("Tempo atual descartado", undo);
  }

  function handleRequestReset() {
    setIsConfirmingReset(true);
  }

  function handleConfirmReset() {
    setIsConfirmingReset(false);
    const { undo } = reset();
    showUndoToast("Cronômetro resetado", undo);
  }

  if (!project) {
    return (
      <PageContainer className="items-center justify-center">
        <EmptyState message="Projeto não encontrado.">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeftIcon /> Voltar para a tela inicial
          </Button>
        </EmptyState>
      </PageContainer>
    );
  }

  const hasLaps = project.stopwatch.laps?.length > 0;
  const canDiscardCurrentTime =
    project.stopwatch.isRunning || project.stopwatch.currentLapTime > 0;
  const canReset = canDiscardCurrentTime || hasLaps;

  return (
    <PageContainer className="items-center">
      <ProjectHeader
        name={project.name}
        onRename={rename}
        onDelete={handleRequestDeleteProject}
        onDiscardCurrentTime={handleRequestDiscard}
        canDiscardCurrentTime={canDiscardCurrentTime}
        onReset={handleRequestReset}
        canReset={canReset}
        onOpenPiP={isPiPSupported && !pipWindow ? openPiP : null}
      />

      <div
        onClick={project.stopwatch.isRunning ? pause : undefined}
        className="flex flex-1 flex-col w-full items-center min-h-0"
      >
        <section className="flex flex-1 items-center justify-center w-full mt-8">
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

      <PiPTimer pipWindow={pipWindow}>
        <TimerDisplay
          time={hasLaps ? splitDisplayTime : displayTime}
          totalTime={hasLaps ? displayTime : null}
          isRunning={project.stopwatch.isRunning}
          hourlyPrice={hourlyPrice}
          enableCopy={false}
        />

        <TimerControls
          isRunning={project.stopwatch.isRunning}
          hasLapTime={splitDisplayTime > 0}
          onStart={start}
          onPause={pause}
          showLap={false}
          className="pb-0"
        />
      </PiPTimer>

      <ConfirmDialog
        open={isConfirmingDelete}
        title="Apagar projeto?"
        description={`"${project.name}" e todas as suas voltas serão removidas.`}
        confirmLabel="Apagar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDeleteProject}
        onCancel={() => setIsConfirmingDelete(false)}
      />

      <ConfirmDialog
        open={isConfirmingDiscard}
        title="Descartar tempo atual?"
        description="O tempo em andamento será zerado. As voltas já registradas serão mantidas."
        confirmLabel="Descartar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDiscard}
        onCancel={() => setIsConfirmingDiscard(false)}
      />

      <ConfirmDialog
        open={isConfirmingReset}
        title="Resetar cronômetro?"
        description="O tempo atual e todas as voltas serão apagados."
        confirmLabel="Resetar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsConfirmingReset(false)}
      />
    </PageContainer>
  );
}
