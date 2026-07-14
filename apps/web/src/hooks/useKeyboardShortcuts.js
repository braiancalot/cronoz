import { useEffect } from "react";

export function useKeyboardShortcuts({ onToggle, pipWindow, enabled = true }) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      if (event.code === "Space") {
        const tag = event.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (event.target.closest?.('[role="dialog"], [role="menu"]')) return;

        // Capture phase + stopPropagation so Space never reaches the focused
        // element. Otherwise hitting Space right after clicking a button (e.g.
        // the options menu) would re-activate it. Space is reserved for toggle.
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }
    };

    // Listen on both documents: the PiP window is a separate document, so a
    // Space pressed while it's focused never reaches the main page's listener.
    const docs = [document, pipWindow?.document].filter(Boolean);
    docs.forEach((doc) => doc.addEventListener("keydown", handleKeyDown, true));
    return () =>
      docs.forEach((doc) =>
        doc.removeEventListener("keydown", handleKeyDown, true),
      );
  }, [onToggle, pipWindow, enabled]);
}
