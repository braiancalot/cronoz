import { describe, expect, it } from "vitest";
import { formatLapsSummaryText, summarizeLaps } from "@/lib/lapsSummary.js";

const MINUTE = 60_000;
const LAPS_NEWEST_FIRST = [
  { id: "b", name: "Layout", lapTime: 30 * MINUTE },
  { id: "a", name: "Briefing", lapTime: 45 * MINUTE },
];

describe("summarizeLaps", () => {
  it("lists laps oldest first with the time accumulated so far", () => {
    const rows = summarizeLaps({
      laps: LAPS_NEWEST_FIRST,
      currentLapTime: 0,
      ignoreMs: false,
    });

    expect(rows).toEqual([
      {
        id: "a",
        name: "Briefing",
        lapTime: 45 * MINUTE,
        cumulativeTime: 45 * MINUTE,
      },
      {
        id: "b",
        name: "Layout",
        lapTime: 30 * MINUTE,
        cumulativeTime: 75 * MINUTE,
      },
    ]);
  });

  it("appends the current lap only when it has time", () => {
    const withCurrent = summarizeLaps({
      laps: LAPS_NEWEST_FIRST,
      currentLapTime: 5 * MINUTE,
      ignoreMs: false,
    });

    expect(withCurrent.at(-1)).toMatchObject({
      name: "Atual",
      lapTime: 5 * MINUTE,
      cumulativeTime: 80 * MINUTE,
    });
  });

  it("skips deleted laps", () => {
    const laps = [
      { id: "c", name: "Apagada", lapTime: MINUTE, deletedAt: 1 },
      ...LAPS_NEWEST_FIRST,
    ];

    const rows = summarizeLaps({ laps, currentLapTime: 0, ignoreMs: false });

    expect(rows.map((row) => row.id)).toEqual(["a", "b"]);
  });

  it("truncates each stored lap to the second when ignoring milliseconds", () => {
    const laps = [
      { id: "b", name: "Layout", lapTime: 1_900 },
      { id: "a", name: "Briefing", lapTime: 1_900 },
    ];

    const rows = summarizeLaps({ laps, currentLapTime: 0, ignoreMs: true });

    expect(rows.map((row) => row.cumulativeTime)).toEqual([1_000, 2_000]);
  });

  it("returns no rows for a project without laps", () => {
    expect(
      summarizeLaps({ laps: undefined, currentLapTime: 0, ignoreMs: false }),
    ).toEqual([]);
  });
});

describe("formatLapsSummaryText", () => {
  const rows = summarizeLaps({
    laps: LAPS_NEWEST_FIRST,
    currentLapTime: 5 * MINUTE,
    ignoreMs: false,
  });

  it("numbers each lap, current one included, with its time in parentheses before the accumulated", () => {
    const text = formatLapsSummaryText({
      projectName: "Projeto X",
      rows,
      totalTime: 80 * MINUTE,
      price: "R$ 13,33",
    });

    expect(text).toBe(
      [
        "Projeto X",
        "",
        "1. Briefing (45m) 45m",
        "2. Layout (30m) 1h15m",
        "3. Atual (5m) 1h20m",
        "",
        "Total 1h20m (R$ 13,33)",
      ].join("\n"),
    );
  });

  it("leaves the price out when it is hidden", () => {
    const text = formatLapsSummaryText({
      projectName: "Projeto X",
      rows,
      totalTime: 80 * MINUTE,
      price: null,
    });

    expect(text.split("\n").at(-1)).toBe("Total 1h20m");
  });
});
