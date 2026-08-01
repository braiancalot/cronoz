import { useState } from "react";

/**
 * Opens a dropdown on tap instead of on pointer-down.
 *
 * Radix opens on `pointerdown`, so a finger that lands on the trigger and drags
 * opens the menu mid-gesture. Barring the default there suppresses Radix's own
 * handler (`composeEventHandlers` skips it once the event is prevented) and
 * leaves `click` as the only way in — which the browser never fires after a
 * gesture turns into a scroll.
 */
export function useTapOnlyDropdown() {
  const [open, setOpen] = useState(false);

  return {
    menuProps: { open, onOpenChange: setOpen },
    triggerProps: {
      onPointerDown: (event) => event.preventDefault(),
      onClick: () => setOpen((prev) => !prev),
    },
  };
}
