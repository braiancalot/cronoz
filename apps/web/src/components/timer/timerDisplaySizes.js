export const SIZES = {
  default: {
    gap: "gap-4",
    // leading-none is required: an arbitrary text-[…] sets font-size alone,
    // unlike the named steps, and the inherited line-height pads the digits.
    time: "text-[clamp(3.75rem,7vw,5.5rem)] leading-none",
    milliseconds: "text-[0.62em]",
    meta: "text-lg",
    price: "text-lg",
    indicatorOffset: "-left-8",
    indicatorSize: "size-4",
  },
  compact: {
    gap: "gap-2",
    time: "text-5xl",
    milliseconds: "text-[0.62em]",
    meta: "text-base",
    price: "text-base",
    indicatorOffset: "-left-7",
    indicatorSize: "size-3.5",
  },
  // Split-screen. The clamp floor is this low because a hundreds-of-hours
  // total is ~12 glyphs and anything bigger overflows a 320px screen.
  sliver: {
    gap: "gap-1.5",
    time: "text-[clamp(2rem,11vw,3.75rem)] leading-none",
    milliseconds: "text-[0.62em]",
    meta: "text-sm",
    price: "text-sm",
    indicatorOffset: "-left-5",
    indicatorSize: "size-2.5",
  },
  mini: {
    gap: "gap-1.5",
    time: "text-3xl",
    milliseconds: "text-xl",
    meta: "text-sm",
    price: "text-sm",
    indicatorOffset: "-left-5",
    indicatorSize: "size-2.5",
  },
};

// PiP-only: the timer text scales continuously with the window (vmin) rather
// than stepping through the tiers, so a small resize nudges the font too. Only
// the text goes fluid — the indicator and controls stay on `size`.
export const FLUID = {
  gap: "gap-[clamp(0.35rem,2.5vmin,1rem)]",
  time: "text-[clamp(1.75rem,18vmin,4rem)]",
  milliseconds: "text-[0.62em]",
  meta: "text-[clamp(0.8rem,5vmin,1.15rem)]",
};
