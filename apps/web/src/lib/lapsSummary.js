import { formatTimeCompact, truncateToSecond } from "@/lib/stopwatch.js";

function chronologicalEntries({ laps, currentLapTime, ignoreMs }) {
  // Stored newest first; reversed so the accumulated time grows down the list.
  const chronological = (laps ?? []).filter((lap) => !lap.deletedAt).reverse();
  const entries = chronological.map(({ id, name, lapTime }) => ({
    id,
    name,
    lapTime: ignoreMs ? truncateToSecond(lapTime) : lapTime,
  }));
  if (currentLapTime <= 0) return entries;
  return [
    ...entries,
    { id: "current", name: "Atual", lapTime: currentLapTime },
  ];
}

export function summarizeLaps({ laps, currentLapTime, ignoreMs }) {
  let accumulated = 0;
  return chronologicalEntries({ laps, currentLapTime, ignoreMs }).map(
    (entry) => {
      accumulated += entry.lapTime;
      return { ...entry, cumulativeTime: accumulated };
    },
  );
}

export function formatLapsSummaryText({ projectName, rows, totalTime, price }) {
  const lines = rows.map(
    (row, index) =>
      `${index + 1}. ${row.name} (${formatTimeCompact(row.lapTime)}) ${formatTimeCompact(row.cumulativeTime)}`,
  );
  const total = formatTimeCompact(totalTime);
  const totalLine = price ? `Total ${total} (${price})` : `Total ${total}`;
  return [projectName, "", ...lines, "", totalLine].join("\n");
}
