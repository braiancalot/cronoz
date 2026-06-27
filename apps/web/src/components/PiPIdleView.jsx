import { DotsThreeVertical } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button.jsx";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu.jsx";
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
  menuContainer,
}) {
  return (
    <div className="flex h-full w-full flex-col p-3">
      <header className="flex items-center justify-between gap-2">
        <h1 className="truncate text-sm font-medium text-muted-foreground">
          {name}
        </h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" title="Mais opções">
              <DotsThreeVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" container={menuContainer}>
            <DropdownMenuItem
              onSelect={onDiscard}
              disabled={!canDiscardCurrentTime}
            >
              Descartar tempo atual
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex flex-1 flex-row items-center justify-center gap-8">
        <TimerDisplay
          time={time}
          totalTime={totalTime}
          isRunning={isRunning}
          hourlyPrice={hourlyPrice}
          size="mini"
        />

        <TimerControls
          isRunning={isRunning}
          hasLapTime={hasLapTime}
          onStart={onStart}
          onPause={onPause}
          onAddLap={onAddLap}
          size="mini"
          orientation="vertical"
          playFirst
        />
      </div>
    </div>
  );
}
