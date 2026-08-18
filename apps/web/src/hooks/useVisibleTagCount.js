import { useLayoutEffect, useRef, useState } from "react";

export function useVisibleTagCount(tags, minimum = 1) {
  const containerRef = useRef(null);
  const measureRef = useRef(null);
  const minimumVisible = Math.min(minimum, tags.length);
  const [measuredCount, setMeasuredCount] = useState(minimumVisible);
  const tagsKey = tags.join("\u0000");

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measureBox = measureRef.current;
    if (!container || !measureBox || tags.length === 0) return undefined;

    let active = true;
    let frameId;

    function measure() {
      if (!active) return;

      const availableWidth = container.clientWidth;
      const tagWidths = [
        ...measureBox.querySelectorAll("[data-tag-measure]"),
      ].map((element) => element.getBoundingClientRect().width);
      const counterWidths = new Map(
        [...measureBox.querySelectorAll("[data-counter-for]")].map(
          (element) => [
            Number(element.dataset.counterFor),
            element.getBoundingClientRect().width,
          ],
        ),
      );
      const gap = Number.parseFloat(getComputedStyle(container).columnGap) || 0;

      let usedWidth = 0;
      let nextCount = minimumVisible;

      for (let count = 1; count <= tagWidths.length; count += 1) {
        usedWidth += tagWidths[count - 1];
        const hidden = tagWidths.length - count;
        const gaps = count - 1 + (hidden > 0 ? 1 : 0);
        const requiredWidth =
          usedWidth + gaps * gap + (counterWidths.get(count) ?? 0);

        if (count <= minimumVisible || requiredWidth <= availableWidth) {
          nextCount = count;
        } else {
          break;
        }
      }

      setMeasuredCount((current) =>
        current === nextCount ? current : nextCount,
      );
    }

    function scheduleMeasure() {
      if (!active) return;
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(measure);
    }

    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(scheduleMeasure);

    observer?.observe(container);
    observer?.observe(measureBox);
    window.addEventListener("resize", scheduleMeasure);
    document.fonts?.ready.then(scheduleMeasure);
    scheduleMeasure();

    return () => {
      active = false;
      cancelAnimationFrame(frameId);
      observer?.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
    };
  }, [minimumVisible, tags.length, tagsKey]);

  return {
    containerRef,
    measureRef,
    visibleCount: Math.min(
      tags.length,
      Math.max(minimumVisible, measuredCount),
    ),
  };
}
