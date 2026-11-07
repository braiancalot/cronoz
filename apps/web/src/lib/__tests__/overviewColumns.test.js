import { describe, expect, it } from "vitest";
import {
  overviewColumnCount,
  splitIntoColumns,
} from "@/lib/overviewColumns.js";

const LAYOUT = { rowPitch: 28, minColumnWidth: 256, columnGap: 8 };

describe("overviewColumnCount", () => {
  it("keeps one column while every row fits in the height", () => {
    const count = overviewColumnCount({
      ...LAYOUT,
      rowCount: 10,
      availableHeight: 280,
      availableWidth: 2000,
    });

    expect(count).toBe(1);
  });

  it("adds the fewest columns that avoid scrolling", () => {
    const count = overviewColumnCount({
      ...LAYOUT,
      rowCount: 21,
      availableHeight: 280,
      availableWidth: 2000,
    });

    expect(count).toBe(3);
  });

  it("stops at the columns that fit side by side", () => {
    const count = overviewColumnCount({
      ...LAYOUT,
      rowCount: 400,
      availableHeight: 280,
      availableWidth: 800,
    });

    expect(count).toBe(3);
  });

  it("falls back to one column before the rows can be measured", () => {
    expect(
      overviewColumnCount({
        ...LAYOUT,
        rowPitch: 0,
        rowCount: 50,
        availableHeight: 280,
        availableWidth: 2000,
      }),
    ).toBe(1);
    expect(
      overviewColumnCount({
        ...LAYOUT,
        rowCount: 0,
        availableHeight: 280,
        availableWidth: 2000,
      }),
    ).toBe(1);
  });

  it("treats a frame shorter than one row as one row per column", () => {
    const count = overviewColumnCount({
      ...LAYOUT,
      rowCount: 3,
      availableHeight: 10,
      availableWidth: 2000,
    });

    expect(count).toBe(3);
  });
});

describe("splitIntoColumns", () => {
  it("keeps the order and gives the extra rows to the first columns", () => {
    expect(splitIntoColumns([1, 2, 3, 4, 5, 6, 7], 3)).toEqual([
      [1, 2, 3],
      [4, 5],
      [6, 7],
    ]);
  });

  it("drops empty columns when there are more columns than rows", () => {
    expect(splitIntoColumns([1, 2], 4)).toEqual([[1], [2]]);
  });
});
