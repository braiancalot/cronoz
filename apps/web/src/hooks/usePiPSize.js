import { useEffect, useState } from "react";

// Maps the PiP window's live dimensions onto the existing TimerDisplay tiers
// (mini → compact → default). Both dimensions have to clear a threshold before
// stepping up, so a window that only grows in one axis keeps the smaller,
// better-fitting tier. The mini floor matches the window's initial 200×170.
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
  const [size, setSize] = useState("mini");

  useEffect(() => {
    if (!pipWindow) {
      setSize("mini");
      return;
    }

    const update = () =>
      setSize(pickPiPSize(pipWindow.innerWidth, pipWindow.innerHeight));

    update();
    pipWindow.addEventListener("resize", update);
    return () => pipWindow.removeEventListener("resize", update);
  }, [pipWindow]);

  return size;
}
