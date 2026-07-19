import { useState } from "react";
import { useNavigate, useParams } from "react-router";

import { useProject } from "@/hooks/useProject.js";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts.js";
import { useControlsLayout } from "@/hooks/useControlsLayout.js";
import { useNarrowViewport } from "@/hooks/useNarrowViewport.js";
import { useAdjustDraft } from "@/hooks/useAdjustDraft.js";
import { useIgnoreMilliseconds } from "@/hooks/useIgnoreMilliseconds.js";
import { useHourlyPrice } from "@/providers/SettingsProvider.jsx";
import { adjustPreview } from "@/lib/stopwatch.js";

import { ArrowLeftIcon } from "@phosphor-icons/react";

import { usePiPWindow } from "@/hooks/usePiPWindow.js";
import { TimerStage } from "@/components/TimerStage.jsx";
import { PiPTimer } from "@/components/PiPTimer.jsx";
import { PiPContent } from "@/components/PiPContent.jsx";
import { PiPPlaceholder } from "@/components/PiPPlaceholder.jsx";
import { ExactTimeDialog } from "@/components/ExactTimeDialog.jsx";
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

  const isNarrow = useNarrowViewport();
  const ignoreMs = useIgnoreMilliseconds();
  const draft = useAdjustDraft();

  const hasLaps = project?.stopwatch?.laps?.length > 0;
  const hasLapsSection = hasLaps || isAddingLap;
  const controlsLayout = useControlsLayout();

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

  const canDiscardCurrentTime =
    project.stopwatch.isRunning || project.stopwatch.currentLapTime > 0;

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

  const timeProps = {
    time: hasLaps ? splitDisplayTime : displayTime,
    totalTime: hasLaps ? displayTime : null,
    isRunning: project.stopwatch.isRunning,
    hourlyPrice,
  };

  return (
    <PageContainer className="items-center">
      <ProjectHeader
        name={project.name}
        compact={controlsLayout === "minimal"}
        onRename={rename}
        onDelete={handleRequestDeleteProject}
        onDiscardCurrentTime={handleRequestDiscard}
        canDiscardCurrentTime={canDiscardCurrentTime}
        onAdjust={handleStartAdjust}
        canAdjust={!isAdjusting && !isPiPActive}
        onOpenPiP={isPiPSupported && !pipWindow ? openPiP : null}
        onViewExactTime={ignoreMs ? handleViewExactTime : null}
      />

      <TimerStage
        layout={controlsLayout}
        placeholder={isPiPActive ? <PiPPlaceholder onClose={closePiP} /> : null}
        isAdjusting={isAdjusting}
        {...timeProps}
        adjustSegment={adjustSegment}
        adjustTotal={adjustTotal}
        adjustLayout={isNarrow ? "row" : "flank"}
        onAdjustStep={draft.step}
        onAdjustSnap={draft.snap}
        onCancelAdjust={handleCancelAdjust}
        onConfirmAdjust={handleConfirmAdjust}
        hasLapTime={splitDisplayTime > 0}
        onStart={start}
        onPause={pause}
        onAddLap={handleStartAddLap}
        lapsProps={lapsProps}
        hasLapsSection={hasLapsSection}
      />

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
    </PageContainer>
  );
}
