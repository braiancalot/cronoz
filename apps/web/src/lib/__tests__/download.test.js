import { describe, it, expect } from "vitest";
import { fileTimestamp } from "@/lib/download.js";

describe("fileTimestamp", () => {
  it("pads every field but the year", () => {
    expect(fileTimestamp(new Date(2026, 0, 5, 9, 7, 3))).toBe(
      "2026-01-05_09-07-03",
    );
  });

  it("keeps two digits when the fields already have them", () => {
    expect(fileTimestamp(new Date(2026, 11, 25, 23, 59, 59))).toBe(
      "2026-12-25_23-59-59",
    );
  });
});
