import { useLayoutEffect, useRef, useState } from "react";

import { hiddenScrollEdges } from "@/lib/scrollEdges.js";

function watchScrollEdges(scroller, onMeasure) {
  const measure = () => onMeasure(hiddenScrollEdges(scroller));
  // The content box grows when a tag is added without the scroller resizing.
  const observer = new ResizeObserver(measure);
  observer.observe(scroller);
  if (scroller.firstElementChild) observer.observe(scroller.firstElementChild);
  scroller.addEventListener("scroll", measure, { passive: true });
  measure();

  return () => {
    observer.disconnect();
    scroller.removeEventListener("scroll", measure);
  };
}

export function useScrollEdges() {
  const scrollerRef = useRef(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  useLayoutEffect(() => {
    if (!scrollerRef.current) return undefined;
    return watchScrollEdges(scrollerRef.current, (next) =>
      setEdges((current) =>
        current.start === next.start && current.end === next.end
          ? current
          : next,
      ),
    );
  }, []);

  return { scrollerRef, edges };
}
