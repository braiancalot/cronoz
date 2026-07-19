import {
  CheckIcon,
  MinusCircleIcon,
  PlusCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { TimerDisplay } from "@/components/TimerDisplay.jsx";
import {
  CONTROL_SIZES,
  CONTROL_GAPS,
  CONTROL_ICONS,
} from "@/components/TimerControls.jsx";
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
  default: "size-5",
  compact: "size-5",
  mini: "size-4",
};

// Snaps the segment to a whole minute — down (floor) or up (ceil).
function RoundButton({ direction, size, onSnap }) {
  const Icon = direction === "down" ? MinusCircleIcon : PlusCircleIcon;
  return (
    <Button
      variant="outline"
      onClick={() => onSnap(direction)}
      className={cn("rounded-full px-0", STEP_BTN[size])}
      aria-label={
        direction === "down" ? "Arredondar para baixo" : "Arredondar para cima"
      }
    >
      <Icon className={ROUND_ICON[size]} />
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

export function AdjustActions({
  size = "default",
  onCancel,
  onConfirm,
  spread = false,
  className,
}) {
  const sizeClass = CONTROL_SIZES[size];
  const iconClass = CONTROL_ICONS[size];

  const cancelButton = (
    <Button
      variant="ghost"
      className={cn("rounded-full bg-muted", sizeClass)}
      onClick={onCancel}
      aria-label="Cancelar"
      title="Cancelar"
    >
      <XIcon weight="regular" className={iconClass} />
    </Button>
  );

  const confirmButton = (
    <Button
      className={cn("rounded-full", sizeClass)}
      onClick={onConfirm}
      aria-label="Pronto"
      title="Pronto"
    >
      <CheckIcon weight="regular" className={iconClass} />
    </Button>
  );

  // Mirrors the TimerControls arrangement it stands in for, so entering adjust
  // mode doesn't slide the buttons sideways.
  return (
    <div className={className}>
      {spread ? (
        <div className="grid grid-cols-2 w-full">
          <div className="flex items-center justify-center">{cancelButton}</div>
          <div className="flex items-center justify-center">
            {confirmButton}
          </div>
        </div>
      ) : (
        <div
          className={cn("flex items-center justify-center", CONTROL_GAPS[size])}
        >
          {cancelButton}
          {confirmButton}
        </div>
      )}
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
            steps={STEPS}
            onStep={onStep}
            onSnap={onSnap}
            size="mini"
            orientation="horizontal"
            mirror
          />
          <Separator orientation="vertical" className="h-8" />
          <StepGroup
            sign={1}
            steps={STEPS}
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
        steps={STEPS}
        onStep={onStep}
        onSnap={onSnap}
        size={size}
        orientation="vertical"
      />
      {display}
      <StepGroup
        sign={1}
        steps={STEPS}
        onStep={onStep}
        onSnap={onSnap}
        size={size}
        orientation="vertical"
      />
    </div>
  );
}
