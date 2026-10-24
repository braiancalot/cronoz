import { useState } from "react";
import { useNavigate, useParams } from "react-router";

import { useProject } from "@/hooks/useProject.js";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts.js";
import { useProjectVoiceCommands } from "@/hooks/useProjectVoiceCommands.js";
import { useControlsLayout } from "@/hooks/useControlsLayout.js";
import {
  useNarrowViewport,
  useSliverViewport,
} from "@/hooks/useNarrowViewport.js";
import { useAdjustDraft } from "@/hooks/useAdjustDraft.js";
import { useIgnoreMilliseconds } from "@/hooks/useIgnoreMilliseconds.js";
import { useHourlyPrice } from "@/providers/SettingsProvider.jsx";
import { adjustPreview } from "@/lib/stopwatch.js";
import { getRealTimeStatus } from "@/lib/realTime.js";
import { pauseRun } from "@/lib/stopwatchTransitions.js";

import { ArrowLeftIcon } from "@phosphor-icons/react";

import { usePiPWindow } from "@/hooks/usePiPWindow.js";
import { TimerStage } from "@/components/timer/TimerStage.jsx";
import { PiPTimer } from "@/components/pip/PiPTimer.jsx";
import { PiPContent } from "@/components/pip/PiPContent.jsx";
import { PiPPlaceholder } from "@/components/pip/PiPPlaceholder.jsx";
import { RealTimeDialog } from "@/components/RealTimeDialog.jsx";
import { ProjectHeader } from "@/components/project/ProjectHeader.jsx";
import { RunningOverlay } from "@/components/RunningOverlay.jsx";
import { VoiceStatus } from "@/components/VoiceStatus.jsx";
import { PageContainer } from "@/components/PageContainer.jsx";
import { ConfirmDialog } from "@/components/ConfirmDialog.jsx";
import { EmptyState } from "@/components/EmptyState.jsx";
import { Button } from "@/components/ui/button.jsx";
import { showUndoToast, UNDO_ON_LIST } from "@/lib/undoToast.js";

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);
  const [isAddingLap, setIsAddingLap] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [realTimeSnapshot, setRealTimeSnapshot] = useState(null);
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
  } = usePiPWindow(pause);

  useKeyboardShortcuts({ onToggle: toggle, pipWindow, enabled: !isAdjusting });
  const voiceCommands = useProjectVoiceCommands({
    onStart: start,
    onPause: pause,
    isAdjusting,
  });

  const isNarrow = useNarrowViewport();
  const isSliver = useSliverViewport();
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
    // Fires after the navigate, so this one lands on the list, not here.
    showUndoToast(`Projeto "${projectName}" apagado`, undo, UNDO_ON_LIST);
  }

  function handleStartAdjust() {
    const settled = pauseRun(project.stopwatch, Date.now());
    pause();
    draft.begin(settled.currentLapTime);
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
  function handleViewRealTime() {
    setRealTimeSnapshot(pauseRun(project.stopwatch, Date.now()));
  }

  function handleRequestDiscard() {
    setIsConfirmingDiscard(true);
  }

  async function handleConfirmDiscard() {
    setIsConfirmingDiscard(false);
    setIsAdjusting(false);
    const { undo } = await discardCurrentTime();
    showUndoToast("Tempo atual descartado", undo);
  }

  async function handlePiPDiscard() {
    const { undo } = await discardCurrentTime();
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

  // Not during PiP: the timer lives in the other window then, and this page is
  // only a placeholder. Adjust mode pauses on entry, so it never overlaps.
  const showRunningOverlay =
    project.stopwatch.isRunning && !isPiPActive && !isAdjusting;

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
        onViewRealTime={handleViewRealTime}
        realTimeStatus={getRealTimeStatus(project.stopwatch)}
        voiceStatus={
          voiceCommands.enabled && (
            <VoiceStatus
              status={voiceCommands.status}
              message={voiceCommands.message}
            />
          )
        }
      />

      <TimerStage
        layout={controlsLayout}
        isSliver={isSliver}
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

      {showRunningOverlay && <RunningOverlay onClick={pause} />}

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
          onBack={() => navigate("/")}
          pipWindow={pipWindow}
        />
      </PiPTimer>

      <RealTimeDialog
        open={!!realTimeSnapshot}
        onOpenChange={(isOpen) => !isOpen && setRealTimeSnapshot(null)}
        stopwatch={realTimeSnapshot ?? project.stopwatch}
        hourlyPrice={hourlyPrice}
        ignoreMs={ignoreMs}
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
