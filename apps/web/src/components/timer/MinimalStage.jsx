import { TimerControls } from "@/components/timer/TimerControls.jsx";
import { TimerAdjuster } from "@/components/timer/TimerAdjuster.jsx";
import { AdjustActions } from "@/components/timer/AdjustActions.jsx";
import { TimerDisplay } from "@/components/timer/TimerDisplay.jsx";
import { TimerSlot } from "@/components/timer/TimerSlot.jsx";
import { LapNameForm } from "@/components/laps/LapNameForm.jsx";
import { cn } from "@/lib/utils.js";
import { COLUMN, CONTROLS_BOX } from "./stageLayout.js";

// gap-3 overrides the roomier default: two stacked 56px buttons plus the
// standard gap would outgrow the height this tier has.
const SIDE_COLUMN = "shrink-0 gap-3";

// No room for laps at all: timer and controls only.
export function MinimalStage({
  isSliver,
  placeholder,
  time,
  totalTime,
  isRunning,
  hourlyPrice,
  isAdjusting,
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
}) {
  const balance = (
    <div aria-hidden className={cn("shrink-0", CONTROLS_BOX.minimal)} />
  );

  const size = isSliver ? "sliver" : "default";
  const displayProps = { time, totalTime, isRunning, hourlyPrice, size };
  const isAdjustingHere = isAdjusting && !placeholder;

  // Unlike the other stages this one doesn't reserve the adjuster's footprint:
  // nothing sits below the timer to be pushed around, and the stage is centred,
  // so the reservation would only spend height this tier hasn't got.
  const center = isAdjustingHere ? (
    <TimerAdjuster
      time={adjustSegment}
      totalTime={adjustTotal}
      hourlyPrice={hourlyPrice}
      size={size}
      layout={adjustLayout}
      onStep={onAdjustStep}
      onSnap={onAdjustSnap}
    />
  ) : placeholder ? (
    <TimerSlot {...displayProps}>{placeholder}</TimerSlot>
  ) : (
    <TimerDisplay {...displayProps} />
  );

  const side = isAdjustingHere ? (
    <AdjustActions
      size="compact"
      orientation="vertical"
      onCancel={onCancelAdjust}
      onConfirm={onConfirmAdjust}
      className={SIDE_COLUMN}
    />
  ) : placeholder ? (
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
      className={SIDE_COLUMN}
    />
  );

  return (
    // A full-size timer showing hours can outgrow a sliver this narrow;
    // clipping a few pixels beats handing the page a scrollbar.
    <div className="flex flex-1 flex-col w-full min-h-0 items-center justify-center overflow-hidden">
      {/* Adjusting wins over the lap form: it is the mode with no other way
          out, and this tier has room for one of them at a time. */}
      {lapsProps.isAddingLap && !isAdjustingHere ? (
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
          <div className="flex flex-1 justify-center min-w-0">{center}</div>
          {side}
        </div>
      )}
    </div>
  );
}
