// One width for every band, so they share a vertical axis. Sized for a timer
// showing hundreds of hours.
export const COLUMN = "w-full max-w-150";

// Space kept clear above the timer, where the toast lands. Sized to the 44px
// toast plus clearance; shrinking it puts toasts back over the timer, and a tap
// that dismisses one then falls through to whatever is beneath. Only this page
// reserves it — the list scrolls, so its undos sit at the bottom instead.
export const TOAST_BAND = "pt-14";

// Kept equal to TOAST_BAND so the timer sits in even space. Two spellings: the
// stacked stage spaces with a container gap, the inline one with a margin.
export const TIMER_GAP = {
  stacked: "gap-14 md:gap-16 lg:gap-24",
  inline: "mt-14",
};

// The controls' footprint, for the two things that stand in for them: the PiP
// placeholder and the inline row's balancing side.
export const CONTROLS_BOX = {
  inline: "w-14",
  minimal: "w-14",
  stacked: "h-24",
};
