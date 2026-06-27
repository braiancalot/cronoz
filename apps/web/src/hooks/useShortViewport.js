import { useState, useEffect } from "react";

const QUERY = "(max-height: 600px)";

export function useShortViewport() {
  const [isShort, setIsShort] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const handler = (event) => setIsShort(event.matches);
    setIsShort(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isShort;
}
