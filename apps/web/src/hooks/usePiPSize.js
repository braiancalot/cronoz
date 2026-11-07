import { useCallback, useSyncExternalStore } from "react";

// Maps the PiP window's live dimensions onto the TimerDisplay tiers. Both axes
// must clear a threshold to step up, so a window that grows in one direction
// keeps the smaller tier. The mini floor matches the initial 200×170.
const TIERS = [
  { size: "default", width: 420, height: 260 },
  { size: "compact", width: 300, height: 210 },
];

export function pickPiPSize(width, height) {
  for (const tier of TIERS) {
    if (width >= tier.width && height >= tier.height) return tier.size;
  }
  return "mini";
}

export function usePiPSize(pipWindow) {
  const subscribe = useCallback(
    (onResize) => {
      if (!pipWindow) return () => {};
      pipWindow.addEventListener("resize", onResize);
      return () => pipWindow.removeEventListener("resize", onResize);
    },
    [pipWindow],
  );

  return useSyncExternalStore(subscribe, () =>
    pipWindow
      ? pickPiPSize(pipWindow.innerWidth, pipWindow.innerHeight)
      : "mini",
  );
}
