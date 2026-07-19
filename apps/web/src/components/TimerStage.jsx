import { TimerControls } from "@/components/TimerControls.jsx";
import { TimerDisplay } from "@/components/TimerDisplay.jsx";
import { TimerAdjuster, AdjustActions } from "@/components/TimerAdjuster.jsx";
import { Laps, LapNameForm } from "@/components/Laps.jsx";
import { cn } from "@/lib/utils.js";

// One column width for every band of the stage, so the timer, the laps and the
// controls share a vertical axis instead of each finding its own. Sized to hold
// a timer showing hundreds of hours at the top of its range.
const COLUMN = "w-full max-w-150";

// Matches the footprint the controls leave in each layout, for the two places
// that have to stand in for them: the PiP placeholder, and the empty side that
// balances the inline row.
const CONTROLS_BOX = { inline: "w-14", minimal: "w-14", stacked: "h-24" };

// The project's main interactive area — timer (or adjuster), controls and laps.
// `layout` comes from useControlsLayout:
//   stacked  — controls under the laps, anchored to the bottom edge.
//   inline   — controls beside the timer, for a phone on its side.
//   minimal  — no room for laps at all; timer and controls only.
//
// `placeholder` takes the timer's slot while the stopwatch runs in the PiP
// window; the controls become a spacer of the same footprint so toggling PiP
// doesn't shift the laps.
export function TimerStage({
  layout,
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
  const pauseOnClick = isRunning && !placeholder ? onPause : undefined;

  const timer = placeholder ?? (
    <TimerDisplay
      time={time}
      totalTime={totalTime}
      isRunning={isRunning}
      hourlyPrice={hourlyPrice}
    />
  );

  if (layout === "minimal") {
    // The laps are gone, so naming one has nowhere to live — it takes over the
    // timer's row for the moment it's open. Adding a lap pauses first, so the
    // hidden timer isn't losing anything.
    return (
      // overflow-hidden is a floor, not a plan: a full-size timer showing hours
      // can just outgrow a sliver this narrow, and clipping a few pixels beats
      // handing the page a scrollbar.
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
          // No balancing spacer here, unlike the inline row: 56px of empty
          // gutter is what pushes a long total past the edge of a sliver.
          <div
            onClick={pauseOnClick}
            className={cn("flex items-center gap-4", COLUMN)}
          >
            <div className="flex flex-1 justify-center min-w-0">
              {placeholder ?? (
                <TimerDisplay
                  time={time}
                  totalTime={totalTime}
                  isRunning={isRunning}
                  hourlyPrice={hourlyPrice}
                  size="sliver"
                />
              )}
            </div>

            {placeholder ? (
              <div
                aria-hidden
                className={cn("shrink-0", CONTROLS_BOX.minimal)}
              />
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
    // A spacer mirrors the controls on the empty side so the timer sits on the
    // row's optical centre rather than being nudged left by their width.
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
            onClick={pauseOnClick}
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

        {hasLapsSection && <Laps {...lapsProps} className="mt-6 mb-4" />}
      </div>
    );
  }

  // Stacked. The controls stay pinned to the bottom edge, within thumb reach.
  return (
    <div className="flex flex-1 flex-col w-full items-center min-h-0">
      {/* Two equal bands: the timer centred in the top half, the laps hanging
          from the midline of the bottom one, so the air between them comes from
          the split and a short list can't creep up on the digits. */}
      <div className="flex flex-1 flex-col w-full items-center min-h-0">
        {/* The pause-on-click sits here rather than on the stage, so it doesn't
            cover the laps: their times stop propagation, the name doesn't. */}
        <section
          onClick={pauseOnClick}
          className={cn(
            "flex flex-1 basis-1/2 min-h-0 items-center justify-center",
            COLUMN,
          )}
        >
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

        {/* items-start, or the card stretches to the band and a short list
            renders with a hole under the rows. The 24rem arm caps it on a tall
            screen; it shares a class with the 100% because a second max-h on
            the Card would lose to this one in tailwind-merge. */}
        {hasLapsSection && (
          <div className="flex flex-1 basis-1/2 min-h-0 w-full justify-center items-start pb-8">
            <Laps {...lapsProps} className="max-h-[min(24rem,100%)]" />
          </div>
        )}
      </div>

      {placeholder ? (
        <div aria-hidden className={cn("shrink-0", CONTROLS_BOX.stacked)} />
      ) : isAdjusting ? (
        <AdjustActions
          spread
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
          spread
          className={cn("shrink-0 pb-8", COLUMN)}
        />
      )}
    </div>
  );
}
