import { Separator } from "@/components/ui/separator.jsx";
import { StepGroup } from "./StepGroup.jsx";

// No ±1m stepper: the round-to-minute buttons already cover the minute.
const STEPS = [
  { ms: 10_000, label: "10s" },
  { ms: 1_000, label: "1s" },
];

// The display's tiers don't map 1:1 onto the buttons: the sliver has no stepper
// size of its own and borrows the mini one.
const STEPPER_SIZE = {
  default: "default",
  compact: "compact",
  sliver: "mini",
  mini: "mini",
};

// The adjuster's chrome around a display, in two layouts:
//   - "flank" (default): steppers in columns on either side of the timer.
//   - "row": timer above a single row (narrow phone, fits 360px).
// Shared by TimerAdjuster and by the slot that reserves its footprint while it
// is closed — the two MUST measure the same, so the arrangement lives here once
// instead of being mirrored. `chromeHidden` veils the steppers with
// `visibility`, which keeps their box while dropping them from the tab order
// and the a11y tree.
export function AdjusterFrame({
  layout = "flank",
  size = "default",
  display,
  onStep,
  onSnap,
  chromeHidden = false,
}) {
  const horizontal = layout === "row";

  const group = (sign) => (
    <StepGroup
      sign={sign}
      steps={STEPS}
      onStep={onStep}
      onSnap={onSnap}
      // The single row can't afford the widest metric on a 360px phone, so it
      // is pinned to the mini button size regardless of the display size.
      size={horizontal ? "mini" : STEPPER_SIZE[size]}
      orientation={horizontal ? "horizontal" : "vertical"}
      mirror={horizontal}
    />
  );

  const veil = (node) =>
    chromeHidden ? (
      <div aria-hidden className="invisible">
        {node}
      </div>
    ) : (
      node
    );

  if (horizontal) {
    return (
      <div className="flex flex-col items-center gap-4">
        {display}
        {veil(
          <div className="flex items-center gap-1">
            {group(-1)}
            <Separator orientation="vertical" className="h-8" />
            {group(1)}
          </div>,
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      {veil(group(-1))}
      {display}
      {veil(group(1))}
    </div>
  );
}
