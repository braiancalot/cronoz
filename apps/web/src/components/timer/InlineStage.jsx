import { TimerControls } from "@/components/timer/TimerControls.jsx";
import { TimerAdjuster } from "@/components/timer/TimerAdjuster.jsx";
import { TimerAdjustSlot } from "@/components/timer/TimerAdjustSlot.jsx";
import { AdjustActions } from "@/components/timer/AdjustActions.jsx";
import { Laps } from "@/components/laps/Laps.jsx";
import { cn } from "@/lib/utils.js";
import { COLUMN, CONTROLS_BOX, TIMER_GAP, TOAST_BAND } from "./stageLayout.js";

// Controls beside the timer, for a phone on its side.
export function InlineStage({
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
  // Mirrors the controls on the empty side so the timer sits on the row's
  // optical centre instead of being nudged left by their width.
  const balance = <div aria-hidden className={CONTROLS_BOX.inline} />;

  const isAdjustingHere = isAdjusting && !placeholder;

  // Adjust mode keeps the row: its actions take the controls' column and its
  // steppers the slot already held for them, so nothing below moves.
  const side = isAdjustingHere ? (
    <AdjustActions
      size="compact"
      orientation="vertical"
      onCancel={onCancelAdjust}
      onConfirm={onConfirmAdjust}
      className="shrink-0"
    />
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
  );

  return (
    <div className="flex flex-1 flex-col w-full min-h-0 items-center">
      <div
        className={cn(
          "flex w-full items-center shrink-0",
          hasLapsSection ? TOAST_BAND : "flex-1",
        )}
      >
        {balance}

        <div className="flex flex-1 justify-center">
          {isAdjustingHere ? (
            <TimerAdjuster
              time={adjustSegment}
              totalTime={adjustTotal}
              hourlyPrice={hourlyPrice}
              size="compact"
              layout={adjustLayout}
              onStep={onAdjustStep}
              onSnap={onAdjustSnap}
            />
          ) : (
            <TimerAdjustSlot layout={adjustLayout} size="compact">
              {timer}
            </TimerAdjustSlot>
          )}
        </div>

        {placeholder ? balance : side}
      </div>

      {hasLapsSection && (
        <>
          <Laps
            {...lapsProps}
            className={cn(
              COLUMN,
              TIMER_GAP.inline,
              "mb-4 transition-opacity",
              lapsDim,
            )}
          />
          {/* Absorbs the space under a short list, so it hugs the laps
              instead of stretching to the bottom edge. */}
          <div className="flex-1 w-full" />
        </>
      )}
    </div>
  );
}
