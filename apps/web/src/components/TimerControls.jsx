import { PlayIcon, PauseIcon, PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button.jsx";
import { cn } from "@/lib/utils.js";

// Shared with AdjustActions so the adjust-mode ✕/✓ buttons keep the exact same
// round footprint as the play/lap controls they replace.
export const CONTROL_SIZES = {
  default: "size-14 [&_svg]:size-7",
  compact: "size-12 [&_svg]:size-7",
  mini: "size-10 [&_svg]:size-5",
};

export const CONTROL_GAPS = {
  default: "gap-4",
  compact: "gap-4",
  mini: "gap-2.5",
};

export function TimerControls({
  isRunning,
  hasLapTime,
  onStart,
  onPause,
  onAddLap,
  showLap = true,
  playFirst = false,
  size = "default",
  orientation = "horizontal",
  className,
}) {
  const sizeClass = CONTROL_SIZES[size];

  const lapButton = showLap && (
    <Button
      variant="ghost"
      className={cn("rounded-full bg-muted", sizeClass)}
      onClick={hasLapTime ? onAddLap : undefined}
      disabled={!hasLapTime}
      aria-label="Volta"
      title="Volta"
    >
      <PlusIcon />
    </Button>
  );

  const playButton = (
    <Button
      className={cn("rounded-full", sizeClass)}
      onClick={isRunning ? onPause : onStart}
      aria-label={isRunning ? "Pausar" : "Iniciar"}
      title={isRunning ? "Pausar" : "Iniciar"}
    >
      {isRunning ? <PauseIcon weight="fill" /> : <PlayIcon weight="fill" />}
    </Button>
  );

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        CONTROL_GAPS[size],
        orientation === "vertical" ? "flex-col" : "flex-row",
        className,
      )}
    >
      {playFirst ? (
        <>
          {playButton}
          {lapButton}
        </>
      ) : (
        <>
          {lapButton}
          {playButton}
        </>
      )}
    </div>
  );
}
