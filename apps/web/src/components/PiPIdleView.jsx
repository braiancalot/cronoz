import { Eraser } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button.jsx";
import { TimerDisplay } from "@/components/TimerDisplay.jsx";
import { TimerControls } from "@/components/TimerControls.jsx";

export function PiPIdleView({
  name,
  time,
  totalTime,
  isRunning,
  hourlyPrice,
  hasLapTime,
  onStart,
  onPause,
  onAddLap,
  onDiscard,
  canDiscardCurrentTime,
}) {
  return (
    <div className="flex h-full w-full flex-col p-3">
      <header className="flex items-center justify-between gap-2">
        <h1 className="truncate text-sm font-medium">{name}</h1>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDiscard}
          disabled={!canDiscardCurrentTime}
          aria-label="Descartar tempo atual"
          title="Descartar tempo atual"
        >
          <Eraser />
        </Button>
      </header>

      <div className="flex flex-1 flex-row items-center justify-center gap-4">
        <TimerDisplay
          time={time}
          totalTime={totalTime}
          isRunning={isRunning}
          hourlyPrice={hourlyPrice}
          enableCopy={false}
          size="mini"
        />

        <TimerControls
          isRunning={isRunning}
          hasLapTime={hasLapTime}
          onStart={onStart}
          onPause={onPause}
          onAddLap={onAddLap}
          size="compact"
          orientation="vertical"
        />
      </div>
    </div>
  );
}
