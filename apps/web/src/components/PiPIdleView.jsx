import {
  ClockIcon,
  DotsThreeVerticalIcon,
  EraserIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button.jsx";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu.jsx";
import { TimerDisplay } from "@/components/TimerDisplay.jsx";
import { TimerControls } from "@/components/TimerControls.jsx";
import { cn } from "@/lib/utils.js";

const HEADER_TEXT = {
  default: "text-lg",
  compact: "text-base",
  mini: "text-sm",
};

export function PiPIdleView({
  size = "mini",
  name,
  time,
  totalTime,
  isRunning,
  hasLapTime,
  onStart,
  onPause,
  onAddLap,
  onDiscard,
  canDiscardCurrentTime,
  onAdjust,
  menuContainer,
}) {
  return (
    <div className="flex h-full w-full flex-col p-3">
      <header className="flex items-center justify-between gap-2">
        <h1
          className={cn(
            "truncate font-medium text-muted-foreground",
            HEADER_TEXT[size],
          )}
        >
          {name}
        </h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" title="Mais opções">
              <DotsThreeVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" container={menuContainer}>
            <DropdownMenuItem onSelect={onAdjust}>
              <ClockIcon />
              Ajustar tempo
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={onDiscard}
              disabled={!canDiscardCurrentTime}
            >
              <EraserIcon />
              Descartar tempo atual
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex flex-1 flex-row items-center">
        <div className="flex flex-1 justify-center">
          <TimerDisplay
            time={time}
            totalTime={totalTime}
            isRunning={isRunning}
            showPrice={false}
            size={size}
          />
        </div>

        <TimerControls
          isRunning={isRunning}
          hasLapTime={hasLapTime}
          onStart={onStart}
          onPause={onPause}
          onAddLap={onAddLap}
          size={size}
          orientation="vertical"
          playFirst
          className="shrink-0"
        />
      </div>
    </div>
  );
}
