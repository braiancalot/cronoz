import { useState } from "react";
import { PiPIdleView } from "@/components/PiPIdleView.jsx";
import { PiPDiscardView } from "@/components/PiPDiscardView.jsx";
import { PiPLapView } from "@/components/PiPLapView.jsx";

export function PiPContent({
  name,
  time,
  totalTime,
  isRunning,
  hourlyPrice,
  hasLapTime,
  lapCount,
  onStart,
  onPause,
  onAddLap,
  onDiscardCurrentTime,
  canDiscardCurrentTime,
}) {
  const [mode, setMode] = useState("idle");
  const [lapName, setLapName] = useState("");

  function handleStartLap() {
    onPause();
    setLapName(`${lapCount + 1}º `);
    setMode("lap");
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
        onConfirm={handleConfirmDiscard}
        onCancel={() => setMode("idle")}
      />
    );
  }

  if (mode === "lap") {
    return (
      <PiPLapView
        value={lapName}
        onChange={setLapName}
        onSubmit={handleSaveLap}
        onCancel={() => setMode("idle")}
      />
    );
  }

  return (
    <PiPIdleView
      name={name}
      time={time}
      totalTime={totalTime}
      isRunning={isRunning}
      hourlyPrice={hourlyPrice}
      hasLapTime={hasLapTime}
      onStart={onStart}
      onPause={onPause}
      onAddLap={handleStartLap}
      onDiscard={() => setMode("discard")}
      canDiscardCurrentTime={canDiscardCurrentTime}
    />
  );
}
