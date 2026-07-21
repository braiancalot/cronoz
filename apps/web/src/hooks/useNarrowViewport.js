import { useState, useEffect } from "react";

function useMaxWidth(px) {
  const query = `(max-width: ${px}px)`;
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (event) => setMatches(event.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

// Below this width the flanked steppers + a readable timer no longer fit side
// by side (a 360px phone overflows), so the adjuster stacks the steppers under
// the timer instead.
export function useNarrowViewport() {
  return useMaxWidth(480);
}

// Split-screen territory: only this narrow does the minimal timer need the
// sliver's shrunk size and dropped spacer. A merely short-but-wide viewport
// stays above this and keeps the full-size, centred timer.
export function useSliverViewport() {
  return useMaxWidth(360);
}
