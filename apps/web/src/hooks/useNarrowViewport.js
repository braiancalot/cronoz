import { useState, useEffect } from "react";

// Below this width the flanked steppers + a readable timer no longer fit side
// by side (a 360px phone overflows), so the adjuster stacks the steppers under
// the timer instead.
const QUERY = "(max-width: 480px)";

export function useNarrowViewport() {
  const [isNarrow, setIsNarrow] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const handler = (event) => setIsNarrow(event.matches);
    setIsNarrow(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isNarrow;
}
