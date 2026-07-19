import { PlayIcon, PauseIcon, PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button.jsx";
import { cn } from "@/lib/utils.js";

// Shared with AdjustActions so the adjust-mode ✕/✓ buttons keep the exact same
// round footprint as the play/lap controls they replace.
export const CONTROL_SIZES = {
  default: "size-16",
  compact: "size-14",
  mini: "size-10",
};

// Goes on the icon, never as [&_svg]:size-* on the button: Button's own
// [&_svg:not([class*='size-'])]:size-4 outranks that and silently wins.
export const CONTROL_ICONS = {
  default: "size-5",
  compact: "size-4",
  mini: "size-3",
};

// Wide enough that a thumb aiming at one can't clip the other — play and lap
// sit next to each other and one of them is destructive to a running timer.
export const CONTROL_GAPS = {
  default: "gap-12",
  compact: "gap-6",
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
  const iconClass = CONTROL_ICONS[size];

  const lapButton = showLap && (
    <Button
      variant="ghost"
      className={cn("rounded-full bg-muted", sizeClass)}
      onClick={hasLapTime ? onAddLap : undefined}
      disabled={!hasLapTime}
      aria-label="Volta"
      title="Volta"
    >
      {/* Not fill: Phosphor's fill Plus is a solid tile with the glyph knocked
          out, a different mark rather than a heavier one. */}
      <PlusIcon weight="regular" className={iconClass} />
    </Button>
  );

  const playButton = (
    <Button
      className={cn("rounded-full", sizeClass)}
      onClick={isRunning ? onPause : onStart}
      aria-label={isRunning ? "Pausar" : "Iniciar"}
      title={isRunning ? "Pausar" : "Iniciar"}
    >
      {isRunning ? (
        <PauseIcon weight="fill" className={iconClass} />
      ) : (
        <PlayIcon weight="fill" className={iconClass} />
      )}
    </Button>
  );

  const first = playFirst ? playButton : lapButton;
  const second = playFirst ? lapButton : playButton;

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        CONTROL_GAPS[size],
        orientation === "vertical" ? "flex-col" : "flex-row",
        className,
      )}
    >
      {first}
      {second}
    </div>
  );
}
