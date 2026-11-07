import { useLayoutEffect, useRef, useState } from "react";
import { overviewColumnCount } from "@/lib/overviewColumns.js";

export function useOverviewColumns({
  rowCount,
  verticalPadding,
  horizontalPadding,
  minColumnWidth,
  columnGap,
}) {
  const frameRef = useRef(null);
  const listRef = useRef(null);
  const [columnCount, setColumnCount] = useState(1);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;

    function measure() {
      const firstRow = listRef.current?.querySelector("[data-overview-row]");
      const rowHeight = firstRow?.getBoundingClientRect().height ?? 0;
      setColumnCount(
        overviewColumnCount({
          rowCount,
          rowPitch: rowHeight,
          availableHeight: frame.clientHeight - verticalPadding,
          availableWidth: frame.clientWidth - horizontalPadding,
          minColumnWidth,
          columnGap,
        }),
      );
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [rowCount, verticalPadding, horizontalPadding, minColumnWidth, columnGap]);

  return { frameRef, listRef, columnCount };
}
