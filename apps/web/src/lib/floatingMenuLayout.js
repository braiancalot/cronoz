// Shared shape for a card row whose menu button floats absolute over the
// trailing edge instead of sitting in the flex flow — ProjectCard needed this
// first (see the ":active"/stretched-link gotcha in CLAUDE.md); LapCard
// adopted the same shape once the two cards were unified.

// The button no longer sits in the flow to set this itself once it floats,
// so the card needs its own floor at the button's height (size-9).
export const FLOATING_MENU_MIN_HEIGHT = "min-h-9";

// The button's own position — right-2 plus its size-9 width reaches 44px in
// from the card's edge.
export const FLOATING_MENU_BUTTON =
  "absolute inset-y-0 right-2 my-auto shrink-0";

// Row content needs at least this much reserved on the trailing edge to clear
// the button with room to spare — pr-8 lands exactly on its edge, no gap.
export const CLEARS_FLOATING_MENU = "pr-10";
