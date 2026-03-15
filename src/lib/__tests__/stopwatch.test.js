import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatTime,
  calculateTotalTime,
  calculateSplitTime,
  sumLapTimes,
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

describe("sumLapTimes", () => {
  it("returns 0 for empty array", () => {
    expect(sumLapTimes([])).toBe(0);
  });

  it("sums lapTime from all laps", () => {
    const laps = [{ lapTime: 3000 }, { lapTime: 5000 }, { lapTime: 2000 }];
    expect(sumLapTimes(laps)).toBe(10000);
  });

  it("returns single lap time for one lap", () => {
    expect(sumLapTimes([{ lapTime: 7000 }])).toBe(7000);
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

  it("returns currentLapTime + sumLapTimes when stopped", () => {
    const stopwatch = {
      isRunning: false,
      startTimestamp: null,
      currentLapTime: 5000,
      laps: [{ lapTime: 3000 }, { lapTime: 2000 }],
    };
    // 5000 + 3000 + 2000 = 10000
    expect(calculateTotalTime(stopwatch)).toBe(10000);
  });

  it("adds elapsed time when running", () => {
    vi.setSystemTime(new Date(10000));

    const stopwatch = {
      isRunning: true,
      startTimestamp: 7000,
      currentLapTime: 2000,
      laps: [],
    };

    // currentLapTime (2000) + (Date.now (10000) - startTimestamp (7000)) = 5000
    expect(calculateTotalTime(stopwatch)).toBe(5000);
  });

  it("includes lap times and elapsed when running", () => {
    vi.setSystemTime(new Date(10000));

    const stopwatch = {
      isRunning: true,
      startTimestamp: 7000,
      currentLapTime: 1000,
      laps: [{ lapTime: 4000 }],
    };

    // sumLaps (4000) + currentLapTime (1000) + elapsed (3000) = 8000
    expect(calculateTotalTime(stopwatch)).toBe(8000);
  });

  it("returns currentLapTime + sumLapTimes when running but no startTimestamp", () => {
    const stopwatch = {
      isRunning: true,
      startTimestamp: null,
      currentLapTime: 3000,
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

  it("returns currentLapTime when stopped with no laps", () => {
    const stopwatch = {
      isRunning: false,
      startTimestamp: null,
      currentLapTime: 5000,
      laps: [],
    };
    expect(calculateSplitTime(stopwatch)).toBe(5000);
  });

  it("returns currentLapTime when stopped with laps (ignores laps)", () => {
    const stopwatch = {
      isRunning: false,
      startTimestamp: null,
      currentLapTime: 3000,
      laps: [{ lapTime: 5000 }, { lapTime: 2000 }],
    };
    expect(calculateSplitTime(stopwatch)).toBe(3000);
  });

  it("returns currentLapTime + elapsed when running", () => {
    vi.setSystemTime(new Date(20000));

    const stopwatch = {
      isRunning: true,
      startTimestamp: 15000,
      currentLapTime: 2000,
      laps: [{ lapTime: 7000 }],
    };
    // currentLapTime (2000) + elapsed (5000) = 7000
    expect(calculateSplitTime(stopwatch)).toBe(7000);
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
