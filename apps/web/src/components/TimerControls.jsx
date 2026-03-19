import { Button } from "@/components/ui/button.jsx";

export function TimerControls({
  isRunning,
  hasLapTime,
  onStart,
  onPause,
  onAddLap,
}) {
  return (
    <div className="flex w-full pb-8 gap-4 items-center justify-center">
      <Button
        variant="outline"
        className="min-w-24 border-primary"
        onClick={hasLapTime ? onAddLap : undefined}
        disabled={!hasLapTime}
      >
        Etapa
      </Button>

      <Button className="min-w-24" onClick={isRunning ? onPause : onStart}>
        {isRunning ? "Pause" : "Start"}
      </Button>
    </div>
  );
}
