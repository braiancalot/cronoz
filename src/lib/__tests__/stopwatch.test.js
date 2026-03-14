import { describe, it, expect } from "vitest";
import { formatTime } from "@/lib/stopwatch.js";

describe("smoke test", () => {
  it("formatTime(0) returns all zeros", () => {
    const result = formatTime(0);
    expect(result).toEqual({
      hours: "00",
      minutes: "00",
      seconds: "00",
      milliseconds: "00",
    });
  });
});
