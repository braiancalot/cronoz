import { useCallback, useMemo, useSyncExternalStore } from "react";

function useMaxWidth(px) {
  const mediaQuery = useMemo(
    () => window.matchMedia(`(max-width: ${px}px)`),
    [px],
  );

  const subscribe = useCallback(
    (onChange) => {
      mediaQuery.addEventListener("change", onChange);
      return () => mediaQuery.removeEventListener("change", onChange);
    },
    [mediaQuery],
  );

  return useSyncExternalStore(
    subscribe,
    () => mediaQuery.matches,
    () => false,
  );
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
