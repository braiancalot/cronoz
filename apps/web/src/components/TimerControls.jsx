import { Button } from "@/components/ui/button.jsx";
import { cn } from "@/lib/utils.js";

export function TimerControls({
  isRunning,
  hasLapTime,
  onStart,
  onPause,
  onAddLap,
  showLap = true,
  className,
}) {
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
          className="min-w-24 border-primary"
          onClick={hasLapTime ? onAddLap : undefined}
          disabled={!hasLapTime}
        >
          Volta
        </Button>
      )}

      <Button
        variant={isRunning ? "secondary" : "default"}
        className="min-w-24"
        onClick={isRunning ? onPause : onStart}
      >
        {isRunning ? "Pause" : "Start"}
      </Button>
    </div>
  );
}
