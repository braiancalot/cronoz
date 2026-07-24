import { TimerDisplay } from "@/components/timer/TimerDisplay.jsx";
import { InlineStage } from "./InlineStage.jsx";
import { MinimalStage } from "./MinimalStage.jsx";
import { StackedStage } from "./StackedStage.jsx";

// The project's main interactive area. `layout` comes from useControlsLayout;
// `placeholder` takes the timer's slot during PiP.
export function TimerStage({ layout, ...props }) {
  const { isRunning, placeholder, time, totalTime, hourlyPrice } = props;

  if (layout === "minimal") return <MinimalStage {...props} />;

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

  const Stage = layout === "inline" ? InlineStage : StackedStage;
  return <Stage {...props} timer={timer} lapsDim={lapsDim} />;
}
