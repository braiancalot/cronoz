import { TimerControls } from "@/components/timer/TimerControls.jsx";
import { TimerDisplay } from "@/components/timer/TimerDisplay.jsx";
import {
  TimerAdjuster,
  AdjustActions,
} from "@/components/timer/TimerAdjuster.jsx";
import { Laps } from "@/components/laps/Laps.jsx";
import { LapNameForm } from "@/components/laps/LapNameForm.jsx";
import { cn } from "@/lib/utils.js";

// One width for every band, so they share a vertical axis. Sized for a timer
// showing hundreds of hours.
const COLUMN = "w-full max-w-150";

// The controls' footprint per layout, for the two things that stand in for
// them: the PiP placeholder and the inline row's balancing side.
const CONTROLS_BOX = { inline: "w-14", minimal: "w-14", stacked: "h-24" };

// The project's main interactive area. `layout` comes from useControlsLayout:
//   stacked  — controls under the laps, anchored to the bottom edge.
//   inline   — controls beside the timer, for a phone on its side.
//   minimal  — no room for laps at all; timer and controls only.
//
// `placeholder` takes the timer's slot during PiP; the controls become a spacer
// of the same footprint so toggling PiP doesn't shift the laps.
export function TimerStage({
  layout,
  isSliver,
  placeholder,
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
  // While running, RunningOverlay covers the stage and pausing on a tap is its
  // job. The laps go dim to show they're covered; the controls clear it.
  const lapsDim = isRunning && !placeholder && "opacity-40";

  const timer = placeholder ?? (
    <TimerDisplay
      time={time}
      totalTime={totalTime}
      isRunning={isRunning}
      hourlyPrice={hourlyPrice}
    />
  );

  if (layout === "minimal") {
    // Stands in for the controls during PiP, so the laps below don't shift.
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

  if (layout === "inline") {
    // Mirrors the controls on the empty side so the timer sits on the row's
    // optical centre instead of being nudged left by their width.
    const balance = <div aria-hidden className={CONTROLS_BOX.inline} />;

    return (
      <div className="flex flex-1 flex-col w-full min-h-0 items-center">
        {isAdjusting && !placeholder ? (
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
            {balance}

            <div className="flex flex-1 justify-center">{timer}</div>

            {placeholder ? (
              balance
            ) : (
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
            )}
          </div>
        )}

        {hasLapsSection && (
          <>
            <Laps
              {...lapsProps}
              className={cn(COLUMN, "mt-6 mb-4 transition-opacity", lapsDim)}
            />
            {/* Absorbs the space under a short list, so it hugs the laps
                instead of stretching to the bottom edge. */}
            <div className="flex-1 w-full" />
          </>
        )}
      </div>
    );
  }

  // Stacked. The controls stay pinned to the bottom edge, within thumb reach.
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
