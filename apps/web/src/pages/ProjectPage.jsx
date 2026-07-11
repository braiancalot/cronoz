import { useState } from "react";
import { useNavigate, useParams } from "react-router";

import { useProject } from "@/hooks/useProject.js";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts.js";
import { useShortViewport } from "@/hooks/useShortViewport.js";
import { useNarrowViewport } from "@/hooks/useNarrowViewport.js";
import { useAdjustDraft } from "@/hooks/useAdjustDraft.js";
import { useIgnoreMilliseconds } from "@/hooks/useIgnoreMilliseconds.js";
import { useHourlyPrice } from "@/providers/SettingsProvider.jsx";
import { adjustPreview } from "@/lib/stopwatch.js";

import { ArrowLeftIcon } from "@phosphor-icons/react";

import { usePiPWindow } from "@/hooks/usePiPWindow.js";
import { TimerControls } from "@/components/TimerControls.jsx";
import { TimerDisplay } from "@/components/TimerDisplay.jsx";
import { TimerAdjuster, AdjustActions } from "@/components/TimerAdjuster.jsx";
import { PiPTimer } from "@/components/PiPTimer.jsx";
import { PiPContent } from "@/components/PiPContent.jsx";
import { PiPPlaceholder } from "@/components/PiPPlaceholder.jsx";
import { Laps } from "@/components/Laps.jsx";
import { ExactTimeDialog } from "@/components/ExactTimeDialog.jsx";
import { ProjectHeader } from "@/components/ProjectHeader.jsx";
import { PageContainer } from "@/components/PageContainer.jsx";
import { ConfirmDialog } from "@/components/ConfirmDialog.jsx";
import { EmptyState } from "@/components/EmptyState.jsx";
import { Button } from "@/components/ui/button.jsx";
import { showUndoToast } from "@/lib/undoToast.js";
import { cn } from "@/lib/utils.js";

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [isAddingLap, setIsAddingLap] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [exactTimeSnapshot, setExactTimeSnapshot] = useState(null);
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
    setCurrentTime,
    reset,
    renameLap,
    deleteLap,
  } = useProject(id);

  const {
    isSupported: isPiPSupported,
    pipWindow,
    openPiP,
    closePiP,
  } = usePiPWindow();

  useKeyboardShortcuts({ onToggle: toggle, pipWindow, enabled: !isAdjusting });

  const isShort = useShortViewport();
  const isNarrow = useNarrowViewport();
  const ignoreMs = useIgnoreMilliseconds();
  const draft = useAdjustDraft();

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

  function handleStartAdjust() {
    const sw = project.stopwatch;
    const settled =
      sw.isRunning && sw.startTimestamp
        ? sw.currentLapTime + (Date.now() - sw.startTimestamp)
        : sw.currentLapTime;
    pause();
    draft.begin(settled);
    setIsAdjusting(true);
  }

  function handleConfirmAdjust() {
    setCurrentTime(draft.value);
    setIsAdjusting(false);
  }

  function handleCancelAdjust() {
    setIsAdjusting(false);
  }

  // Freeze the current total into a paused snapshot so the consultation panel
  // reads a static value while the stopwatch keeps running underneath.
  function handleViewExactTime() {
    const sw = project.stopwatch;
    const settled =
      sw.isRunning && sw.startTimestamp
        ? sw.currentLapTime + (Date.now() - sw.startTimestamp)
        : sw.currentLapTime;
    setExactTimeSnapshot({
      ...sw,
      isRunning: false,
      startTimestamp: null,
      currentLapTime: settled,
    });
  }

  function handleRequestDiscard() {
    setIsConfirmingDiscard(true);
  }

  function handleConfirmDiscard() {
    setIsConfirmingDiscard(false);
    setIsAdjusting(false);
    const { undo } = discardCurrentTime();
    showUndoToast("Tempo atual descartado", undo);
  }

  function handlePiPDiscard() {
    const { undo } = discardCurrentTime();
    showUndoToast("Tempo atual descartado", undo);
  }

  function handleRequestReset() {
    setIsConfirmingReset(true);
  }

  function handleConfirmReset() {
    setIsConfirmingReset(false);
    setIsAdjusting(false);
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

  const adjustPreviewTotals = adjustPreview(project.stopwatch, draft.value, {
    ignoreMs,
  });
  const adjustSegment = adjustPreviewTotals.segment;
  const adjustTotal = hasLaps ? adjustPreviewTotals.total : null;

  const isPiPActive = !!pipWindow;

  const lapsProps = {
    laps: project.stopwatch.laps,
    onRenameLap: renameLap,
    onDeleteLap: deleteLap,
    isAddingLap,
    addLapName: lapName,
    onAddLapNameChange: setLapName,
    onConfirmAddLap: handleConfirmAddLap,
    onCancelAddLap: handleCancelAddLap,
  };
  const hasLapsSection = hasLaps || isAddingLap;

  return (
    <PageContainer className="items-center">
      <ProjectHeader
        name={project.name}
        onRename={rename}
        onDelete={handleRequestDeleteProject}
        onDiscardCurrentTime={handleRequestDiscard}
        canDiscardCurrentTime={canDiscardCurrentTime}
        onAdjust={handleStartAdjust}
        canAdjust={!isAdjusting && !isPiPActive}
        onReset={handleRequestReset}
        canReset={canReset}
        onOpenPiP={isPiPSupported && !pipWindow ? openPiP : null}
        onViewExactTime={ignoreMs ? handleViewExactTime : null}
      />

      {isPiPActive ? (
        <div className="flex flex-1 flex-col w-full items-center min-h-0">
          <section className="flex flex-1 items-center justify-center w-full">
            <PiPPlaceholder onClose={closePiP} />
          </section>

          {hasLapsSection && <Laps {...lapsProps} />}

          {/* Mirror the bottom TimerControls footprint (size-14 + pb-8) so the
              laps list doesn't shift when toggling PiP. */}
          <div aria-hidden className="h-22 shrink-0" />
        </div>
      ) : isShort ? (
        <div
          onClick={project.stopwatch.isRunning ? pause : undefined}
          className="flex flex-1 flex-col w-full min-h-0 items-center"
        >
          {isAdjusting ? (
            <div
              className={cn(
                "flex flex-col items-center gap-3 shrink-0",
                hasLaps || isAddingLap ? "pt-2" : "flex-1 justify-center",
              )}
            >
              <TimerAdjuster
                time={adjustSegment}
                totalTime={adjustTotal}
                hourlyPrice={hourlyPrice}
                size="compact"
                layout={isNarrow ? "row" : "flank"}
                onStep={draft.step}
                onSnap={draft.snap}
              />
              <AdjustActions
                size="compact"
                onCancel={handleCancelAdjust}
                onConfirm={handleConfirmAdjust}
              />
            </div>
          ) : (
            <div
              className={cn(
                "flex w-full items-center shrink-0",
                hasLaps || isAddingLap ? "pt-2" : "flex-1",
              )}
            >
              <div className="flex flex-1 justify-center">
                <TimerDisplay
                  time={hasLaps ? splitDisplayTime : displayTime}
                  totalTime={hasLaps ? displayTime : null}
                  isRunning={project.stopwatch.isRunning}
                  hourlyPrice={hourlyPrice}
                  size="compact"
                />
              </div>

              <TimerControls
                isRunning={project.stopwatch.isRunning}
                hasLapTime={splitDisplayTime > 0}
                onStart={start}
                onPause={pause}
                onAddLap={handleStartAddLap}
                orientation="vertical"
                size="compact"
                className="shrink-0"
              />
            </div>
          )}

          {hasLapsSection && <Laps {...lapsProps} className="mt-4 mb-4" />}
        </div>
      ) : (
        <div
          onClick={project.stopwatch.isRunning ? pause : undefined}
          className="flex flex-1 flex-col w-full items-center min-h-0"
        >
          <section className="flex flex-1 items-center justify-center w-full mt-8">
            {isAdjusting ? (
              <TimerAdjuster
                time={adjustSegment}
                totalTime={adjustTotal}
                hourlyPrice={hourlyPrice}
                layout={isNarrow ? "row" : "flank"}
                onStep={draft.step}
                onSnap={draft.snap}
              />
            ) : (
              <TimerDisplay
                time={hasLaps ? splitDisplayTime : displayTime}
                totalTime={hasLaps ? displayTime : null}
                isRunning={project.stopwatch.isRunning}
                hourlyPrice={hourlyPrice}
              />
            )}
          </section>

          {hasLapsSection && <Laps {...lapsProps} />}

          {isAdjusting ? (
            <AdjustActions
              onCancel={handleCancelAdjust}
              onConfirm={handleConfirmAdjust}
              className="pb-8"
            />
          ) : (
            <TimerControls
              isRunning={project.stopwatch.isRunning}
              hasLapTime={splitDisplayTime > 0}
              onStart={start}
              onPause={pause}
              onAddLap={handleStartAddLap}
              orientation="horizontal"
              className="pb-8"
            />
          )}
        </div>
      )}

      <PiPTimer pipWindow={pipWindow}>
        <PiPContent
          name={project.name}
          time={hasLaps ? splitDisplayTime : displayTime}
          totalTime={hasLaps ? displayTime : null}
          isRunning={project.stopwatch.isRunning}
          hasLapTime={splitDisplayTime > 0}
          lapCount={project.stopwatch.laps?.length ?? 0}
          onStart={start}
          onPause={pause}
          onAddLap={addLap}
          onDiscardCurrentTime={handlePiPDiscard}
          canDiscardCurrentTime={canDiscardCurrentTime}
          onCommitAdjust={setCurrentTime}
          pipWindow={pipWindow}
        />
      </PiPTimer>

      <ExactTimeDialog
        open={!!exactTimeSnapshot}
        onOpenChange={(isOpen) => !isOpen && setExactTimeSnapshot(null)}
        stopwatch={exactTimeSnapshot ?? project.stopwatch}
        hourlyPrice={hourlyPrice}
      />

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
