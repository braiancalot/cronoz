import { ScrollArea } from "@/components/ui/scroll-area.jsx";
import { useOverviewColumns } from "@/hooks/useOverviewColumns.js";
import { overviewMaxWidth, splitIntoColumns } from "@/lib/overviewColumns.js";
import { timeColumnWidth } from "@/lib/stopwatch.js";
import { LapName } from "./LapName.jsx";
import { LapTime } from "./LapTime.jsx";

// MUST match the classes below: py-1.5 on each panel, gap-2 and pr-3 on the list.
const PANEL_PADDING = 12;
const COLUMN_GAP = 8;
const SCROLLBAR_CLEARANCE = 12;
const MIN_COLUMN_WIDTH = 256;
const MAX_COLUMN_WIDTH = 600;

function LapOverviewRow({ row, cumulativeWidth }) {
  return (
    <div data-overview-row className="flex items-center gap-3 px-3 py-1">
      <LapName>{row.name}</LapName>
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex text-muted-foreground tabular-nums">
          (
          <LapTime time={row.lapTime} label="Tempo da volta" />)
        </div>
        <LapTime
          time={row.cumulativeTime}
          label="Tempo acumulado"
          width={cumulativeWidth}
        />
      </div>
    </div>
  );
}

export function LapsOverview({ rows }) {
  const cumulativeWidth = timeColumnWidth(rows.at(-1)?.cumulativeTime ?? 0);
  const { frameRef, listRef, columnCount } = useOverviewColumns({
    rowCount: rows.length,
    verticalPadding: PANEL_PADDING,
    horizontalPadding: SCROLLBAR_CLEARANCE,
    minColumnWidth: MIN_COLUMN_WIDTH,
    columnGap: COLUMN_GAP,
  });
  const maxWidth =
    overviewMaxWidth({
      columnCount,
      maxColumnWidth: MAX_COLUMN_WIDTH,
      columnGap: COLUMN_GAP,
    }) + SCROLLBAR_CLEARANCE;

  return (
    <div ref={frameRef} className="flex-1 min-h-0 w-full">
      <ScrollArea type="auto" className="h-full">
        <div
          ref={listRef}
          className="mx-auto flex items-start gap-2 pr-3"
          style={{ maxWidth }}
        >
          {splitIntoColumns(rows, columnCount).map((column) => (
            <div
              key={column[0].id}
              className="flex-1 min-w-0 rounded-xl bg-card py-1.5 text-sm"
            >
              {column.map((row) => (
                <LapOverviewRow
                  key={row.id}
                  row={row}
                  cumulativeWidth={cumulativeWidth}
                />
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
