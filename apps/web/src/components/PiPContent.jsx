import { useState } from "react";
import { PiPIdleView } from "@/components/PiPIdleView.jsx";
import { PiPDiscardView } from "@/components/PiPDiscardView.jsx";
import { PiPLapView } from "@/components/PiPLapView.jsx";
import { TimerAdjuster, AdjustActions } from "@/components/TimerAdjuster.jsx";
import { useAdjustDraft } from "@/hooks/useAdjustDraft.js";
import { usePiPSize } from "@/hooks/usePiPSize.js";

export function PiPContent({
  name,
  time,
  totalTime,
  isRunning,
  hasLapTime,
  lapCount,
  onStart,
  onPause,
  onAddLap,
  onDiscardCurrentTime,
  canDiscardCurrentTime,
  onCommitAdjust,
  pipWindow,
}) {
  const size = usePiPSize(pipWindow);
  const [mode, setMode] = useState("idle");
  const [lapName, setLapName] = useState("");
  const draft = useAdjustDraft();

  function handleStartLap() {
    onPause();
    setLapName(`${lapCount + 1}º `);
    setMode("lap");
  }

  function handleStartAdjust() {
    onPause();
    draft.begin(time);
    setMode("adjust");
  }

  function handleConfirmAdjust() {
    onCommitAdjust(draft.value);
    setMode("idle");
  }

  function handleSaveLap() {
    if (!lapName) return;
    onAddLap(lapName);
    setMode("idle");
  }

  function handleConfirmDiscard() {
    onDiscardCurrentTime();
    setMode("idle");
  }

  if (mode === "discard") {
    return (
      <PiPDiscardView
        size={size}
        onConfirm={handleConfirmDiscard}
        onCancel={() => setMode("idle")}
      />
    );
  }

  if (mode === "lap") {
    return (
      <PiPLapView
        size={size}
        value={lapName}
        onChange={setLapName}
        onSubmit={handleSaveLap}
        onCancel={() => setMode("idle")}
      />
    );
  }

  if (mode === "adjust") {
    const previewTotal =
      totalTime == null ? null : totalTime - time + draft.value;
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3">
        <TimerAdjuster
          time={draft.value}
          totalTime={previewTotal}
          showPrice={false}
          size={size}
          onStep={draft.step}
          onSnap={draft.snap}
        />
        <AdjustActions
          size={size}
          onCancel={() => setMode("idle")}
          onConfirm={handleConfirmAdjust}
        />
      </div>
    );
  }

  return (
    <PiPIdleView
      size={size}
      name={name}
      time={time}
      totalTime={totalTime}
      isRunning={isRunning}
      hasLapTime={hasLapTime}
      onStart={onStart}
      onPause={onPause}
      onAddLap={handleStartLap}
      onDiscard={() => setMode("discard")}
      canDiscardCurrentTime={canDiscardCurrentTime}
      onAdjust={handleStartAdjust}
      menuContainer={pipWindow?.document?.body}
    />
  );
}
