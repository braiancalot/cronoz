import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatTime,
  formatTimeCompact,
  calculateTotalTime,
  calculateSplitTime,
  sumLapTimes,
  hasHours,
  truncateToSecond,
  isStopwatchLive,
  isStopwatchStale,
  RECOVERY_GRACE_PERIOD,
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

  it("caps elapsed at lastActiveAt when the heartbeat is stale", () => {
    vi.setSystemTime(new Date(100000));

    const stopwatch = {
      isRunning: true,
      startTimestamp: 7000,
      lastActiveAt: 17000, // now - lastActiveAt = 83000 ≥ grace → stale
      currentLapTime: 2000,
      laps: [{ lapTime: 4000 }],
    };

    // elapsed capped at lastActiveAt: 17000 - 7000 = 10000
    // sumLaps (4000) + currentLapTime (2000) + 10000 = 16000
    expect(calculateTotalTime(stopwatch)).toBe(16000);
  });

  it("uses now (not lastActiveAt) when the heartbeat is fresh", () => {
    vi.setSystemTime(new Date(20000));

    const stopwatch = {
      isRunning: true,
      startTimestamp: 7000,
      lastActiveAt: 19000, // now - lastActiveAt = 1000 < grace → live
      currentLapTime: 1000,
      laps: [{ lapTime: 4000 }],
    };

    // elapsed = now (20000) - startTimestamp (7000) = 13000
    // sumLaps (4000) + currentLapTime (1000) + 13000 = 18000
    expect(calculateTotalTime(stopwatch)).toBe(18000);
  });

  it("truncates each lap before summing when ignoreMs is true", () => {
    const stopwatch = {
      isRunning: false,
      startTimestamp: null,
      currentLapTime: 0,
      laps: [{ lapTime: 1999 }, { lapTime: 1999 }, { lapTime: 1999 }],
    };
    // sum truncados: 1000 + 1000 + 1000 = 3000 (vs. 5997 → 5000 sem per-lap)
    expect(calculateTotalTime(stopwatch, { ignoreMs: true })).toBe(3000);
  });

  it("truncates currentLapTime alongside laps when ignoreMs is true", () => {
    const stopwatch = {
      isRunning: false,
      startTimestamp: null,
      currentLapTime: 800,
      laps: [{ lapTime: 1500 }, { lapTime: 1500 }],
    };
    // 1000 + 1000 + truncate(800)=0 = 2000
    expect(calculateTotalTime(stopwatch, { ignoreMs: true })).toBe(2000);
  });

  it("truncates the in-progress portion (currentLapTime + elapsed) when ignoreMs is true and running", () => {
    vi.setSystemTime(new Date(10000));

    const stopwatch = {
      isRunning: true,
      startTimestamp: 7000,
      currentLapTime: 1500,
      laps: [{ lapTime: 1999 }],
    };
    // truncate(1999)=1000 + truncate(1500 + 3000)=truncate(4500)=4000 = 5000
    expect(calculateTotalTime(stopwatch, { ignoreMs: true })).toBe(5000);
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

  it("caps elapsed at lastActiveAt when the heartbeat is stale", () => {
    vi.setSystemTime(new Date(100000));

    const stopwatch = {
      isRunning: true,
      startTimestamp: 15000,
      lastActiveAt: 20000, // stale
      currentLapTime: 2000,
      laps: [{ lapTime: 7000 }],
    };
    // currentLapTime (2000) + capped elapsed (20000 - 15000 = 5000) = 7000
    expect(calculateSplitTime(stopwatch)).toBe(7000);
  });

  it("truncates split when ignoreMs is true and stopped", () => {
    const stopwatch = {
      isRunning: false,
      startTimestamp: null,
      currentLapTime: 1999,
      laps: [],
    };
    expect(calculateSplitTime(stopwatch, { ignoreMs: true })).toBe(1000);
  });

  it("truncates split when ignoreMs is true and running", () => {
    vi.setSystemTime(new Date(10000));

    const stopwatch = {
      isRunning: true,
      startTimestamp: 7000,
      currentLapTime: 0,
      laps: [],
    };
    // currentLapTime (0) + elapsed (3000) = 3000 → truncado segue 3000
    expect(calculateSplitTime(stopwatch, { ignoreMs: true })).toBe(3000);
  });

  it("truncates split below one second to 0 when ignoreMs is true", () => {
    const stopwatch = {
      isRunning: false,
      startTimestamp: null,
      currentLapTime: 750,
      laps: [],
    };
    expect(calculateSplitTime(stopwatch, { ignoreMs: true })).toBe(0);
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

describe("formatTimeCompact", () => {
  it("uses minutes and seconds when no hours", () => {
    // 5m 20s
    expect(formatTimeCompact(320000)).toBe("5m20s");
  });

  it("uses hours and minutes when hours present", () => {
    // 1h 5m 20s
    expect(formatTimeCompact(3920000)).toBe("1h5m");
  });

  it("does not pad single-digit values", () => {
    // 5m 7s
    expect(formatTimeCompact(307000)).toBe("5m7s");
  });

  it("omits seconds when zero", () => {
    // 5m exactly
    expect(formatTimeCompact(300000)).toBe("5m");
  });

  it("omits minutes when zero in mm:ss format", () => {
    // 30s
    expect(formatTimeCompact(30000)).toBe("30s");
  });

  it("omits minutes when zero in hh:mm format", () => {
    // 2h exactly
    expect(formatTimeCompact(7200000)).toBe("2h");
  });

  it("returns 0s for 0", () => {
    expect(formatTimeCompact(0)).toBe("0s");
  });
});

describe("isStopwatchLive", () => {
  it("returns true when running with a fresh heartbeat", () => {
    const now = 100000;
    const stopwatch = {
      isRunning: true,
      lastActiveAt: now - (RECOVERY_GRACE_PERIOD - 1),
    };
    expect(isStopwatchLive(stopwatch, now)).toBe(true);
  });

  it("returns false when running with a stale heartbeat", () => {
    const now = 100000;
    const stopwatch = {
      isRunning: true,
      lastActiveAt: now - RECOVERY_GRACE_PERIOD,
    };
    expect(isStopwatchLive(stopwatch, now)).toBe(false);
  });

  it("returns false when paused", () => {
    const now = 100000;
    const stopwatch = { isRunning: false, lastActiveAt: now };
    expect(isStopwatchLive(stopwatch, now)).toBe(false);
  });

  it("returns false when running without a heartbeat", () => {
    expect(
      isStopwatchLive({ isRunning: true, lastActiveAt: null }, 100000),
    ).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(isStopwatchLive(null, 100000)).toBe(false);
    expect(isStopwatchLive(undefined, 100000)).toBe(false);
  });
});

describe("isStopwatchStale", () => {
  it("returns true when running with a stale heartbeat", () => {
    const now = 100000;
    const stopwatch = {
      isRunning: true,
      lastActiveAt: now - RECOVERY_GRACE_PERIOD,
    };
    expect(isStopwatchStale(stopwatch, now)).toBe(true);
  });

  it("returns false when running with a fresh heartbeat", () => {
    const now = 100000;
    const stopwatch = {
      isRunning: true,
      lastActiveAt: now - (RECOVERY_GRACE_PERIOD - 1),
    };
    expect(isStopwatchStale(stopwatch, now)).toBe(false);
  });

  it("returns false when paused", () => {
    const now = 100000;
    const stopwatch = { isRunning: false, lastActiveAt: now - 999999 };
    expect(isStopwatchStale(stopwatch, now)).toBe(false);
  });

  it("returns false when running without a heartbeat", () => {
    expect(
      isStopwatchStale({ isRunning: true, lastActiveAt: null }, 100000),
    ).toBe(false);
  });
});

describe("truncateToSecond", () => {
  it("returns 0 for 0", () => {
    expect(truncateToSecond(0)).toBe(0);
  });

  it("floors values below one second to 0", () => {
    expect(truncateToSecond(750)).toBe(0);
  });

  it("floors to whole second", () => {
    expect(truncateToSecond(1999)).toBe(1000);
  });

  it("keeps exact-second value unchanged", () => {
    expect(truncateToSecond(2000)).toBe(2000);
  });

  it("floors a multi-minute value", () => {
    expect(truncateToSecond(154567)).toBe(154000);
  });
});
