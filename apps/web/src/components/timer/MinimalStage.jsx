import { TimerControls } from "@/components/timer/TimerControls.jsx";
import { TimerDisplay } from "@/components/timer/TimerDisplay.jsx";
import { LapNameForm } from "@/components/laps/LapNameForm.jsx";
import { cn } from "@/lib/utils.js";
import { COLUMN, CONTROLS_BOX } from "./stageLayout.js";

// No room for laps at all: timer and controls only.
export function MinimalStage({
  isSliver,
  placeholder,
  time,
  totalTime,
  isRunning,
  hourlyPrice,
  hasLapTime,
  onStart,
  onPause,
  onAddLap,
  lapsProps,
}) {
  const balance = (
    <div aria-hidden className={cn("shrink-0", CONTROLS_BOX.minimal)} />
  );

  return (
    // A full-size timer showing hours can outgrow a sliver this narrow;
    // clipping a few pixels beats handing the page a scrollbar.
    <div className="flex flex-1 flex-col w-full min-h-0 items-center justify-center overflow-hidden">
      {lapsProps.isAddingLap ? (
        <div className={COLUMN}>
          <LapNameForm
            value={lapsProps.addLapName}
            onChange={lapsProps.onAddLapNameChange}
            onSubmit={lapsProps.onConfirmAddLap}
            onCancel={lapsProps.onCancelAddLap}
          />
        </div>
      ) : (
        <div className={cn("flex items-center gap-4", COLUMN)}>
          <div className="flex flex-1 justify-center min-w-0">
            {placeholder ?? (
              <TimerDisplay
                time={time}
                totalTime={totalTime}
                isRunning={isRunning}
                hourlyPrice={hourlyPrice}
                size={isSliver ? "sliver" : "default"}
              />
            )}
          </div>

          {placeholder ? (
            balance
          ) : (
            // gap-3 overrides the roomier default: two stacked 56px buttons
            // plus the standard gap would outgrow the height this tier has.
            <TimerControls
              isRunning={isRunning}
              hasLapTime={hasLapTime}
              onStart={onStart}
              onPause={onPause}
              onAddLap={onAddLap}
              orientation="vertical"
              size="compact"
              className="shrink-0 gap-3"
            />
          )}
        </div>
      )}
    </div>
  );
}
