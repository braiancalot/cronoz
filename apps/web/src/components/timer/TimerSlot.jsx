import { TimerDisplay } from "./TimerDisplay.jsx";

// Holds the timer's exact footprint for a stand-in (the PiP placeholder): a
// hidden timer sets the box, the stand-in floats centred on top. Hand-sizing it
// can't work — the height rides a clamp on the viewport and on the total line.
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
