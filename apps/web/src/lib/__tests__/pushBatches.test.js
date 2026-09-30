import { describe, expect, it } from "vitest";
import { splitPushBatches } from "@/lib/pushBatches.js";

describe("splitPushBatches", () => {
  it("splits projects into batches of at most batchSize", () => {
    const batches = splitPushBatches({
      projects: [1, 2, 3, 4, 5],
      settings: [],
      batchSize: 2,
    });
    expect(batches.map((b) => b.projects)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("sends every setting with the first batch only", () => {
    const batches = splitPushBatches({
      projects: [1, 2, 3],
      settings: ["s"],
      batchSize: 2,
    });
    expect(batches.map((b) => b.settings)).toEqual([["s"], []]);
  });

  it("returns one batch for settings without projects", () => {
    expect(
      splitPushBatches({ projects: [], settings: ["s"], batchSize: 2 }),
    ).toEqual([{ projects: [], settings: ["s"] }]);
  });
});
