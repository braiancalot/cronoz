import { useEffect, useState } from "react";

// Placement follows the viewport's proportion, not a height threshold: a short
// but portrait popup window still stacks (controls below), where a threshold
// would wrongly push them beside the timer. The laps list scrolls internally,
// so there's no need to measure whether everything fits.
export function pickLayout(width, height) {
  return width > height ? "inline" : "stacked";
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
