import { Button } from "@/components/ui/button.jsx";
import { cn } from "@/lib/utils.js";

const SIZES = {
  default: { button: "default", minWidth: "min-w-24" },
  compact: { button: "sm", minWidth: "min-w-20" },
};

export function TimerControls({
  isRunning,
  hasLapTime,
  onStart,
  onPause,
  onAddLap,
  showLap = true,
  size = "default",
  className,
}) {
  const s = SIZES[size];

  return (
    <div
      className={cn(
        "flex w-full pb-8 gap-4 items-center justify-center",
        className,
      )}
    >
      {showLap && (
        <Button
          variant="outline"
          size={s.button}
          className={cn(s.minWidth, "border-primary")}
          onClick={hasLapTime ? onAddLap : undefined}
          disabled={!hasLapTime}
        >
          Volta
        </Button>
      )}

      <Button
        variant={isRunning ? "secondary" : "default"}
        size={s.button}
        className={s.minWidth}
        onClick={isRunning ? onPause : onStart}
      >
        {isRunning ? "Pause" : "Start"}
      </Button>
    </div>
  );
}
