import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatTime,
  calculateTotalTime,
  calculateSplitTime,
  hasHours,
} from "@/lib/stopwatch.js";

describe("formatTime", () => {
  it("returns all zeros for 0ms", () => {
    expect(formatTime(0)).toEqual({
      hours: "00",
      minutes: "00",
      seconds: "00",
      milliseconds: "00",
    });
  });

  it("formats 1 second", () => {
    expect(formatTime(1000)).toEqual({
      hours: "00",
      minutes: "00",
      seconds: "01",
      milliseconds: "00",
    });
  });

  it("formats 1 minute and 1 second", () => {
    expect(formatTime(61000)).toEqual({
      hours: "00",
      minutes: "01",
      seconds: "01",
      milliseconds: "00",
    });
  });

  it("formats 1 hour, 1 minute, 1 second and 10ms", () => {
    expect(formatTime(3661010)).toEqual({
      hours: "01",
      minutes: "01",
      seconds: "01",
      milliseconds: "01",
    });
  });

  it("formats time just under 1 hour", () => {
    // 59:59.99
    expect(formatTime(3599990)).toEqual({
      hours: "00",
      minutes: "59",
      seconds: "59",
      milliseconds: "99",
    });
  });

  it("zero-pads single digit values", () => {
    // 5 seconds and 50ms
    expect(formatTime(5050)).toEqual({
      hours: "00",
      minutes: "00",
      seconds: "05",
      milliseconds: "05",
    });
  });

  it("handles milliseconds truncation (floors to centiseconds)", () => {
    // 999ms → floor(999/10) = 99
    expect(formatTime(999)).toEqual({
      hours: "00",
      minutes: "00",
      seconds: "00",
      milliseconds: "99",
    });
  });
});

describe("calculateTotalTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 0 for null", () => {
    expect(calculateTotalTime(null)).toBe(0);
  });

  it("returns 0 for undefined", () => {
    expect(calculateTotalTime(undefined)).toBe(0);
  });

  it("returns totalTime when stopped", () => {
    const stopwatch = {
      isRunning: false,
      startTimestamp: null,
      totalTime: 5000,
      laps: [],
    };
    expect(calculateTotalTime(stopwatch)).toBe(5000);
  });

  it("adds elapsed time when running", () => {
    vi.setSystemTime(new Date(10000));

    const stopwatch = {
      isRunning: true,
      startTimestamp: 7000,
      totalTime: 2000,
      laps: [],
    };

    // totalTime (2000) + (Date.now (10000) - startTimestamp (7000)) = 5000
    expect(calculateTotalTime(stopwatch)).toBe(5000);
  });

  it("returns totalTime when running but no startTimestamp", () => {
    const stopwatch = {
      isRunning: true,
      startTimestamp: null,
      totalTime: 3000,
      laps: [],
    };
    expect(calculateTotalTime(stopwatch)).toBe(3000);
  });
});

describe("calculateSplitTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 0 for null", () => {
    expect(calculateSplitTime(null)).toBe(0);
  });

  it("returns total time when no laps exist", () => {
    const stopwatch = {
      isRunning: false,
      startTimestamp: null,
      totalTime: 5000,
      laps: [],
    };
    expect(calculateSplitTime(stopwatch)).toBe(5000);
  });

  it("returns time since last lap", () => {
    const stopwatch = {
      isRunning: false,
      startTimestamp: null,
      totalTime: 8000,
      laps: [{ totalTime: 5000 }, { totalTime: 2000 }],
    };
    // total (8000) - laps[0].totalTime (5000) = 3000
    expect(calculateSplitTime(stopwatch)).toBe(3000);
  });

  it("calculates split time while running", () => {
    vi.setSystemTime(new Date(20000));

    const stopwatch = {
      isRunning: true,
      startTimestamp: 15000,
      totalTime: 5000,
      laps: [{ totalTime: 7000 }],
    };
    // total = 5000 + (20000 - 15000) = 10000
    // split = 10000 - 7000 = 3000
    expect(calculateSplitTime(stopwatch)).toBe(3000);
  });
});

describe("hasHours", () => {
  it('returns false for "00"', () => {
    expect(hasHours("00")).toBe(false);
  });

  it('returns true for "01"', () => {
    expect(hasHours("01")).toBe(true);
  });

  it('returns true for "10"', () => {
    expect(hasHours("10")).toBe(true);
  });
});
