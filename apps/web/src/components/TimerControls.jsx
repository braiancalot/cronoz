import { Play, Pause, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button.jsx";
import { cn } from "@/lib/utils.js";

const SIZES = {
  default: {
    volta: "size-14 [&_svg]:size-7",
    main: "size-16 [&_svg]:size-9",
  },
  compact: {
    volta: "size-10 [&_svg]:size-6",
    main: "size-12 [&_svg]:size-7",
  },
};

export function TimerControls({
  isRunning,
  hasLapTime,
  onStart,
  onPause,
  onAddLap,
  showLap = true,
  size = "default",
  orientation = "horizontal",
  className,
}) {
  const s = SIZES[size];

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4",
        orientation === "vertical" ? "flex-col" : "flex-row",
        className,
      )}
    >
      {showLap && (
        <Button
          variant="ghost"
          className={cn("rounded-full bg-muted", s.volta)}
          onClick={hasLapTime ? onAddLap : undefined}
          disabled={!hasLapTime}
          aria-label="Volta"
          title="Volta"
        >
          <Plus />
        </Button>
      )}

      <Button
        className={cn("rounded-full", s.main)}
        onClick={isRunning ? onPause : onStart}
        aria-label={isRunning ? "Pausar" : "Iniciar"}
        title={isRunning ? "Pausar" : "Iniciar"}
      >
        {isRunning ? <Pause weight="fill" /> : <Play weight="fill" />}
      </Button>
    </div>
  );
}
