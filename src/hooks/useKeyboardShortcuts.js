"use client";

import { useEffect } from "react";

export function useKeyboardShortcuts({ onToggle }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === "Space") {
        const tag = event.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;

        event.preventDefault();
        onToggle();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onToggle]);
}
