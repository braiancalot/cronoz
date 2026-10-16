import { useLayoutEffect, useRef } from "react";

// Scrolls an element into view once the render it triggered has committed,
// so layout shifts from that render (a button appearing) are already applied.
export function useRevealAfterRender() {
  const pendingRef = useRef(null);

  useLayoutEffect(() => {
    pendingRef.current?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "smooth",
    });
    pendingRef.current = null;
  });

  return function revealAfterRender(element) {
    pendingRef.current = element;
  };
}
