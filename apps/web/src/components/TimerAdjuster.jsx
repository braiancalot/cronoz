import { TimerDisplay } from "@/components/TimerDisplay.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import { cn } from "@/lib/utils.js";

const STEPS = [
  { ms: 60_000, label: "1m" },
  { ms: 10_000, label: "10s" },
  { ms: 1_000, label: "1s" },
];

const STEP_BTN = {
  default: "h-11 w-14 text-sm",
  compact: "h-10 w-12 text-sm",
  mini: "h-8 w-10 text-xs",
};

function StepGroup({ sign, onStep, size, orientation }) {
  // In the stacked (below) layout the smallest step sits closest to the timer's
  // center, so the increase group reads 1s/10s/1m from the center outward.
  const steps =
    orientation === "horizontal" && sign > 0 ? [...STEPS].reverse() : STEPS;

  // A stacked row holds all 6 buttons side by side, so it can't afford the
  // widest metric on a 360px phone — cap it at the mini size there.
  const btnSize = orientation === "horizontal" ? "mini" : size;

  return (
    <div
      className={cn(
        "flex gap-2",
        orientation === "vertical" ? "flex-col" : "flex-row",
      )}
    >
      {steps.map((step) => (
        <Button
          key={step.label}
          variant="outline"
          onClick={() => onStep(sign * step.ms)}
          className={cn("rounded-full px-0 tabular-nums", STEP_BTN[btnSize])}
          aria-label={`${sign < 0 ? "Diminuir" : "Aumentar"} ${step.label}`}
        >
          {sign < 0 ? "−" : "+"}
          {step.label}
        </Button>
      ))}
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

// Controlled cluster: the timer flanked by (or stacked over) the steppers. The
// draft value and the action buttons live in the consumer.
export function TimerAdjuster({
  time,
  totalTime = null,
  hourlyPrice = 10,
  showPrice = true,
  size = "default",
  stack = false,
  onStep,
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

  if (stack) {
    return (
      <div className="flex flex-col items-center gap-4">
        {display}
        <div className="flex items-center gap-2">
          <StepGroup
            sign={-1}
            onStep={onStep}
            size={size}
            orientation="horizontal"
          />
          <Separator orientation="vertical" className="h-8" />
          <StepGroup
            sign={1}
            onStep={onStep}
            size={size}
            orientation="horizontal"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      <StepGroup sign={-1} onStep={onStep} size={size} orientation="vertical" />
      {display}
      <StepGroup sign={1} onStep={onStep} size={size} orientation="vertical" />
    </div>
  );
}
