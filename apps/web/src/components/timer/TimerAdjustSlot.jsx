import { AdjusterFrame } from "./AdjusterFrame.jsx";

const ignoreStep = () => {};

// Reserves the adjuster's exact footprint around the plain timer, so opening
// adjust mode only reveals the steppers — the digits stay put and the laps
// under them don't shift. Hand-sizing it can't work: the row layout's height
// rides the display's viewport clamp, the flank one the stepper metrics.
//
// The no-op handlers stand in for the real ones: the round buttons only exist
// when the adjuster gets an `onSnap`, so the reservation has to claim one too.
export function TimerAdjustSlot({ layout, size, children }) {
  return (
    <AdjusterFrame
      layout={layout}
      size={size}
      display={children}
      onStep={ignoreStep}
      onSnap={ignoreStep}
      chromeHidden
    />
  );
}
