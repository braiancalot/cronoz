import { useState } from "react";

/**
 * Keeps a dropdown inside a scrollable list from hijacking a scroll gesture.
 *
 * Radix opens on `pointerdown`, so a finger that lands on the trigger and drags
 * opens the menu mid-gesture. The browser fires `pointercancel` once that touch
 * is claimed by the scroller — a real tap never does — so that is the signal to
 * take the open back.
 */
export function useScrollSafeDropdown() {
  const [open, setOpen] = useState(false);

  return {
    // A modal menu locks page scroll while open, which is what left the list
    // frozen when the accidental open slipped through.
    menuProps: { open, onOpenChange: setOpen, modal: false },
    triggerProps: { onPointerCancel: () => setOpen(false) },
  };
}
