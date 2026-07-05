import { MinusCircleIcon, PlusCircleIcon } from "@phosphor-icons/react";
import { TimerDisplay } from "@/components/TimerDisplay.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import { cn } from "@/lib/utils.js";

// No ±1m stepper: the round-to-minute buttons already cover the minute.
const STEPS = [
  { ms: 10_000, label: "10s" },
  { ms: 1_000, label: "1s" },
];

const STEP_BTN = {
  default: "h-11 w-14 text-sm",
  compact: "h-10 w-12 text-sm",
  // Narrowed so the single row of 6 (2 round + 4 step) clears a 360px phone.
  mini: "h-8 w-9 text-xs",
};

// The round button shares the stepper footprint so every control is the same
// size, with a larger icon so it fills the button and reads as one.
const ROUND_ICON = {
  default: "[&_svg]:size-7",
  compact: "[&_svg]:size-6",
  mini: "[&_svg]:size-5",
};

// Snaps the segment to a whole minute — down (floor) or up (ceil).
function RoundButton({ direction, size, onSnap }) {
  const Icon = direction === "down" ? MinusCircleIcon : PlusCircleIcon;
  return (
    <Button
      variant="outline"
      onClick={() => onSnap(direction)}
      className={cn("rounded-full px-0", STEP_BTN[size], ROUND_ICON[size])}
      aria-label={
        direction === "down" ? "Arredondar para baixo" : "Arredondar para cima"
      }
    >
      <Icon />
    </Button>
  );
}

// A decrease (sign −1) or increase (sign +1) group: the steppers plus, when
// onSnap is given, the round button as the outermost item.
//   - vertical: round on top, steppers below.
//   - horizontal + mirror: the two groups mirror around the timer's center, so
//     the increase group reads outward and its round sits at the far right.
//     Used by the single-row layout.
function StepGroup({
  sign,
  steps,
  onStep,
  onSnap,
  size,
  orientation,
  mirror = false,
}) {
  const horizontal = orientation === "horizontal";
  const orderedSteps =
    horizontal && mirror && sign > 0 ? [...steps].reverse() : steps;
  const direction = sign < 0 ? "down" : "up";

  const roundButton = onSnap ? (
    <RoundButton direction={direction} size={size} onSnap={onSnap} />
  ) : null;

  const roundFirst = !horizontal || !mirror || sign < 0;

  return (
    <div
      className={cn(
        "flex items-center",
        horizontal ? "flex-row gap-1" : "flex-col gap-2",
      )}
    >
      {roundFirst && roundButton}
      {orderedSteps.map((step) => (
        <Button
          key={step.label}
          variant="outline"
          onClick={() => onStep(sign * step.ms)}
          className={cn("rounded-full px-0 tabular-nums", STEP_BTN[size])}
          aria-label={`${sign < 0 ? "Diminuir" : "Aumentar"} ${step.label}`}
        >
          {sign < 0 ? "-" : "+"}
          {step.label}
        </Button>
      ))}
      {!roundFirst && roundButton}
    </div>
  );
}

// The inner row reserves the height of the TimerControls buttons it replaces
// (size-14/12/10), so swapping controls ↔ actions in the same slot doesn't
// change its height and the timer above stays put. The padding (e.g. pb-8)
// rides on the outer wrapper so it isn't eaten by the min-height.
const ACTIONS_MIN_H = {
  default: "min-h-14",
  compact: "min-h-12",
  mini: "min-h-10",
};

export function AdjustActions({
  size = "default",
  onCancel,
  onConfirm,
  className,
}) {
  const btnSize = size === "mini" ? "sm" : "default";
  return (
    <div className={className}>
      <div
        className={cn(
          "flex items-center justify-center gap-3",
          ACTIONS_MIN_H[size],
        )}
      >
        <Button variant="ghost" size={btnSize} onClick={onCancel}>
          Cancelar
        </Button>
        <Button size={btnSize} onClick={onConfirm}>
          Pronto
        </Button>
      </div>
    </div>
  );
}

// Controlled cluster: the timer with its steppers. The draft value and the
// action buttons live in the consumer. Two layouts:
//   - "flank" (default): steppers in columns on either side of the timer.
//   - "row": timer above a single row (narrow phone, fits 360px).
export function TimerAdjuster({
  time,
  totalTime = null,
  hourlyPrice = 10,
  showPrice = true,
  size = "default",
  layout = "flank",
  onStep,
  onSnap,
}) {
  const steps = STEPS;

  const display = (
    <TimerDisplay
      time={time}
      totalTime={totalTime}
      isRunning={false}
      hourlyPrice={hourlyPrice}
      showPrice={showPrice}
      enableCopy={false}
      size={size}
    />
  );

  if (layout === "row") {
    // The single row can't afford the widest metric on a 360px phone, so it is
    // pinned to the mini button size regardless of the display size.
    return (
      <div className="flex flex-col items-center gap-4">
        {display}
        <div className="flex items-center gap-1">
          <StepGroup
            sign={-1}
            steps={steps}
            onStep={onStep}
            onSnap={onSnap}
            size="mini"
            orientation="horizontal"
            mirror
          />
          <Separator orientation="vertical" className="h-8" />
          <StepGroup
            sign={1}
            steps={steps}
            onStep={onStep}
            onSnap={onSnap}
            size="mini"
            orientation="horizontal"
            mirror
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      <StepGroup
        sign={-1}
        steps={steps}
        onStep={onStep}
        onSnap={onSnap}
        size={size}
        orientation="vertical"
      />
      {display}
      <StepGroup
        sign={1}
        steps={steps}
        onStep={onStep}
        onSnap={onSnap}
        size={size}
        orientation="vertical"
      />
    </div>
  );
}
