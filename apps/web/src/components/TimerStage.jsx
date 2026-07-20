import { TimerControls } from "@/components/TimerControls.jsx";
import { TimerDisplay } from "@/components/TimerDisplay.jsx";
import { TimerAdjuster, AdjustActions } from "@/components/TimerAdjuster.jsx";
import { Laps, LapNameForm } from "@/components/Laps.jsx";
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
    // The laps are gone, so naming one takes over the timer's row while it's
    // open. Adding a lap pauses first, so the hidden timer loses nothing.
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
          // No balancing spacer here, unlike the inline row: 56px of empty
          // gutter is what pushes a long total off the edge of a sliver.
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

        {hasLapsSection && (
          <>
            <Laps {...lapsProps} className={cn(COLUMN, "mt-6 mb-4")} />
            {/* Absorbs the space under a short list, so it pauses on tap like
                the rest of the backdrop. */}
            <div onClick={pauseOnClick} className="flex-1 w-full" />
          </>
        )}
      </div>
    );
  }

  // Stacked. The controls stay pinned to the bottom edge, within thumb reach.
  return (
    <div className="flex flex-1 flex-col w-full items-center min-h-0">
      {/* Timer and laps ride as one centred group: the gap between them holds
          them apart and grows on wider screens (a phone wants them close, a
          desktop wants room), while the leftover height splits evenly above and
          below. py keeps the group off the header and controls when the content
          is tall enough to fill the height. The timer never shrinks; the laps
          take the slack, capping at max-h and scrolling past it. The group
          carries pause-on-click for its margins; the laps card opts out. */}
      <div
        onClick={pauseOnClick}
        className="flex flex-1 flex-col w-full items-center justify-center min-h-0 gap-6 md:gap-16 lg:gap-24 py-8"
      >
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
            {/* display:contents so the card stays the group's flex item; the
                wrapper only keeps lap clicks off the pause handler. */}
            <div onClick={(e) => e.stopPropagation()} className="contents">
              <Laps {...lapsProps} className={cn(COLUMN, "max-h-[32rem]")} />
            </div>
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
