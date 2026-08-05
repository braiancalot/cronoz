import { useState } from "react";

// Opens a dropdown on tap instead of on pointer-down, so a finger that lands on
// the trigger and drags scrolls instead of opening the menu. Barring the default
// suppresses Radix's own pointerdown handler (`composeEventHandlers` skips it
// once the event is prevented), leaving `click` as the only way in.
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
