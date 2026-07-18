import { TimerControls } from "@/components/TimerControls.jsx";
import { TimerDisplay } from "@/components/TimerDisplay.jsx";
import { TimerAdjuster, AdjustActions } from "@/components/TimerAdjuster.jsx";
import { Laps } from "@/components/Laps.jsx";
import { cn } from "@/lib/utils.js";

// The project's main interactive area — timer (or adjuster), controls, and laps
// — laid out either "stacked" (controls below the laps) or "inline" (controls
// beside the timer). useControlsLayout picks which.
export function TimerStage({
  layout,
  isAdjusting,
  // timer
  time,
  totalTime,
  isRunning,
  hourlyPrice,
  // adjust
  adjustSegment,
  adjustTotal,
  adjustLayout,
  onAdjustStep,
  onAdjustSnap,
  onCancelAdjust,
  onConfirmAdjust,
  // controls
  hasLapTime,
  onStart,
  onPause,
  onAddLap,
  // laps
  lapsProps,
  hasLapsSection,
}) {
  if (layout === "inline") {
    return (
      <div
        onClick={isRunning ? onPause : undefined}
        className="flex flex-1 flex-col w-full min-h-0 items-center"
      >
        {isAdjusting ? (
          <div
            className={cn(
              "flex flex-col items-center gap-3 shrink-0",
              hasLapsSection ? "pt-2" : "flex-1 justify-center",
            )}
          >
            <TimerAdjuster
              time={adjustSegment}
              totalTime={adjustTotal}
              hourlyPrice={hourlyPrice}
              size="compact"
              layout={adjustLayout}
              onStep={onAdjustStep}
              onSnap={onAdjustSnap}
            />
            <AdjustActions
              size="compact"
              onCancel={onCancelAdjust}
              onConfirm={onConfirmAdjust}
            />
          </div>
        ) : (
          <div
            className={cn(
              "flex w-full items-center shrink-0",
              hasLapsSection ? "pt-2" : "flex-1",
            )}
          >
            <div className="flex flex-1 justify-center">
              <TimerDisplay
                time={time}
                totalTime={totalTime}
                isRunning={isRunning}
                hourlyPrice={hourlyPrice}
                size="compact"
              />
            </div>

            <TimerControls
              isRunning={isRunning}
              hasLapTime={hasLapTime}
              onStart={onStart}
              onPause={onPause}
              onAddLap={onAddLap}
              orientation="vertical"
              size="compact"
              className="shrink-0"
            />
          </div>
        )}

        {hasLapsSection && <Laps {...lapsProps} className="mt-4 mb-4" />}
      </div>
    );
  }

  return (
    <div
      onClick={isRunning ? onPause : undefined}
      className="flex flex-1 flex-col w-full items-center min-h-0"
    >
      <section className="flex flex-1 items-center justify-center w-full mt-8">
        {isAdjusting ? (
          <TimerAdjuster
            time={adjustSegment}
            totalTime={adjustTotal}
            hourlyPrice={hourlyPrice}
            layout={adjustLayout}
            onStep={onAdjustStep}
            onSnap={onAdjustSnap}
          />
        ) : (
          <TimerDisplay
            time={time}
            totalTime={totalTime}
            isRunning={isRunning}
            hourlyPrice={hourlyPrice}
          />
        )}
      </section>

      {hasLapsSection && <Laps {...lapsProps} />}

      {isAdjusting ? (
        <AdjustActions
          onCancel={onCancelAdjust}
          onConfirm={onConfirmAdjust}
          className="pb-8"
        />
      ) : (
        <TimerControls
          isRunning={isRunning}
          hasLapTime={hasLapTime}
          onStart={onStart}
          onPause={onPause}
          onAddLap={onAddLap}
          orientation="horizontal"
          className="pb-8"
        />
      )}
    </div>
  );
}
