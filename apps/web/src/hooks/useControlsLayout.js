import { useEffect, useState } from "react";

const SHORT_HEIGHT = 600;
// Below this the laps can't fit without an outer scroll — a split-screen sliver
// lands here. Sits under a landscape phone (~390) so that case keeps its laps.
const MINIMAL_HEIGHT = 360;

// The proportion check keeps a short-but-portrait popup stacked, where a bare
// height threshold would wrongly push its controls beside the timer.
export function pickLayout(width, height) {
  if (height < MINIMAL_HEIGHT) return "minimal";
  return width > height && height < SHORT_HEIGHT ? "inline" : "stacked";
}

function viewportLayout() {
  if (typeof window === "undefined") return "stacked";
  const vv = window.visualViewport;
  return pickLayout(
    vv?.width ?? window.innerWidth,
    vv?.height ?? window.innerHeight,
  );
}

export function useControlsLayout() {
  const [layout, setLayout] = useState(viewportLayout);

  useEffect(() => {
    const update = () => setLayout(viewportLayout());
    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);

  return layout;
}
