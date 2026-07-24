import { TimerDisplay } from "@/components/timer/TimerDisplay.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import { StepGroup } from "./StepGroup.jsx";

// No ±1m stepper: the round-to-minute buttons already cover the minute.
const STEPS = [
  { ms: 10_000, label: "10s" },
  { ms: 1_000, label: "1s" },
];

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

  const group = (sign, groupSize, orientation, mirror) => (
    <StepGroup
      sign={sign}
      steps={STEPS}
      onStep={onStep}
      onSnap={onSnap}
      size={groupSize}
      orientation={orientation}
      mirror={mirror}
    />
  );

  if (layout === "row") {
    // The single row can't afford the widest metric on a 360px phone, so it is
    // pinned to the mini button size regardless of the display size.
    return (
      <div className="flex flex-col items-center gap-4">
        {display}
        <div className="flex items-center gap-1">
          {group(-1, "mini", "horizontal", true)}
          <Separator orientation="vertical" className="h-8" />
          {group(1, "mini", "horizontal", true)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      {group(-1, size, "vertical", false)}
      {display}
      {group(1, size, "vertical", false)}
    </div>
  );
}
