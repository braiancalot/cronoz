import { TimerDisplay } from "@/components/timer/TimerDisplay.jsx";
import { AdjusterFrame } from "./AdjusterFrame.jsx";

// Controlled cluster: the timer with its steppers. The draft value and the
// action buttons live in the consumer; AdjusterFrame owns the arrangement and
// TimerAdjustSlot reserves this same footprint while the adjuster is closed.
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
  return (
    <AdjusterFrame
      layout={layout}
      size={size}
      onStep={onStep}
      onSnap={onSnap}
      display={
        <TimerDisplay
          time={time}
          totalTime={totalTime}
          isRunning={false}
          hourlyPrice={hourlyPrice}
          showPrice={showPrice}
          enableCopy={false}
          size={size}
        />
      }
    />
  );
}
