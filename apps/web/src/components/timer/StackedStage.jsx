import { TimerControls } from "@/components/timer/TimerControls.jsx";
import { TimerAdjuster } from "@/components/timer/TimerAdjuster.jsx";
import { AdjustActions } from "@/components/timer/AdjustActions.jsx";
import { Laps } from "@/components/laps/Laps.jsx";
import { cn } from "@/lib/utils.js";
import { COLUMN, CONTROLS_BOX } from "./stageLayout.js";

// Controls under the laps, pinned to the bottom edge within thumb reach.
export function StackedStage({
  timer,
  lapsDim,
  placeholder,
  isAdjusting,
  isRunning,
  hourlyPrice,
  adjustSegment,
  adjustTotal,
  adjustLayout,
  onAdjustStep,
  onAdjustSnap,
  onCancelAdjust,
  onConfirmAdjust,
  hasLapTime,
  onStart,
  onPause,
  onAddLap,
  lapsProps,
  hasLapsSection,
}) {
  return (
    <div className="flex flex-1 flex-col w-full items-center min-h-0">
      <div className="flex flex-1 flex-col w-full items-center justify-center min-h-0 gap-6 md:gap-16 lg:gap-24 py-8">
        <section className={cn("flex shrink-0 justify-center", COLUMN)}>
          {isAdjusting && !placeholder ? (
            <TimerAdjuster
              time={adjustSegment}
              totalTime={adjustTotal}
              hourlyPrice={hourlyPrice}
              layout={adjustLayout}
              onStep={onAdjustStep}
              onSnap={onAdjustSnap}
            />
          ) : (
            timer
          )}
        </section>

        {hasLapsSection && (
          <div className="flex min-h-0 w-full justify-center">
            <Laps
              {...lapsProps}
              className={cn(COLUMN, "max-h-128 transition-opacity", lapsDim)}
            />
          </div>
        )}
      </div>

      {placeholder ? (
        <div aria-hidden className={cn("shrink-0", CONTROLS_BOX.stacked)} />
      ) : isAdjusting ? (
        <AdjustActions
          onCancel={onCancelAdjust}
          onConfirm={onConfirmAdjust}
          className={cn("shrink-0 pb-8", COLUMN)}
        />
      ) : (
        <TimerControls
          isRunning={isRunning}
          hasLapTime={hasLapTime}
          onStart={onStart}
          onPause={onPause}
          onAddLap={onAddLap}
          className={cn("shrink-0 pb-8", COLUMN)}
        />
      )}
    </div>
  );
}
