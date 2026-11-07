export function overviewColumnCount({
  rowCount,
  rowPitch,
  availableHeight,
  availableWidth,
  minColumnWidth,
  columnGap,
}) {
  if (rowCount === 0 || rowPitch <= 0) return 1;

  const rowsPerColumn = Math.max(1, Math.floor(availableHeight / rowPitch));
  const needed = Math.ceil(rowCount / rowsPerColumn);
  const fitting = Math.floor(
    (availableWidth + columnGap) / (minColumnWidth + columnGap),
  );
  return Math.max(1, Math.min(needed, fitting));
}

export function overviewMaxWidth({ columnCount, maxColumnWidth, columnGap }) {
  return columnCount * maxColumnWidth + (columnCount - 1) * columnGap;
}

export function splitIntoColumns(rows, columnCount) {
  const base = Math.floor(rows.length / columnCount);
  const extra = rows.length % columnCount;
  const columns = [];
  let start = 0;
  for (let index = 0; index < columnCount; index += 1) {
    const length = base + (index < extra ? 1 : 0);
    columns.push(rows.slice(start, start + length));
    start += length;
  }
  return columns.filter((column) => column.length > 0);
}
