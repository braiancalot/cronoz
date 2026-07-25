import { TimerDisplay } from "./TimerDisplay.jsx";

// Holds the timer's exact footprint while something stands in for it (the PiP
// placeholder): a hidden timer sets the box, the stand-in floats centred on top.
// Sizing the stand-in by hand can't work — the timer's height rides a clamp on
// the viewport and on whether there's a total line.
export function TimerSlot({ children, ...timerProps }) {
  return (
    <div className="relative">
      <div aria-hidden className="invisible">
        <TimerDisplay {...timerProps} />
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
