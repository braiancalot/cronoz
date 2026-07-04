import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatTime,
  formatTimeCompact,
  formatHms,
  calculateTotalTime,
  calculateSplitTime,
  adjustPreview,
  sumLapTimes,
  hasHours,
  truncateToSecond,
  roundDownToMinute,
  roundUpToMinute,
  isStopwatchLive,
  isStopwatchStale,
  calculateTotalPrice,
  summarizeExactTime,
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

describe("adjustPreview", () => {
  const stopwatch = {
    isRunning: false,
    startTimestamp: null,
    currentLapTime: 800,
    laps: [{ lapTime: 1500 }, { lapTime: 1500 }],
  };

  it("returns the raw segment and total when not ignoring ms", () => {
    const { segment, total } = adjustPreview(stopwatch, 800);
    expect(segment).toBe(800);
    expect(total).toBe(3800); // 1500 + 1500 + 800
  });

  it("truncates each lap and the segment when ignoring ms", () => {
    const { segment, total } = adjustPreview(stopwatch, 800, {
      ignoreMs: true,
    });
    // trunc(800)=0 ; trunc(1500)+trunc(1500)+trunc(800) = 1000+1000+0
    expect(segment).toBe(0);
    expect(total).toBe(2000);
  });

  it("matches the live total when the segment equals currentLapTime", () => {
    const paused = { ...stopwatch, currentLapTime: 1500 };
    const { total } = adjustPreview(paused, 1500, { ignoreMs: true });
    expect(total).toBe(calculateTotalTime(paused, { ignoreMs: true }));
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

describe("formatHms", () => {
  it("returns 0s for 0", () => {
    expect(formatHms(0)).toBe("0s");
  });

  it("shows only seconds under a minute", () => {
    expect(formatHms(5000)).toBe("5s");
  });

  it("shows minutes and seconds", () => {
    expect(formatHms(65000)).toBe("1m 5s");
  });

  it("shows hours, minutes and seconds", () => {
    expect(formatHms(3665000)).toBe("1h 1m 5s");
  });

  it("keeps a zero minutes segment when hours are present", () => {
    expect(formatHms(3605000)).toBe("1h 0m 5s");
  });

  it("appends the fraction of a second when requested", () => {
    // 3s + floor(998/10)=99 centis
    expect(formatHms(3998, { fraction: true })).toBe("3,99s");
  });

  it("appends the fraction alongside minutes", () => {
    expect(formatHms(65850, { fraction: true })).toBe("1m 5,85s");
  });

  it("zero-pads the fraction to two digits", () => {
    expect(formatHms(2050, { fraction: true })).toBe("2,05s");
  });

  it("keeps a two-digit fraction of zero", () => {
    expect(formatHms(2000, { fraction: true })).toBe("2,00s");
  });
});

describe("calculateTotalPrice", () => {
  it("returns 0 for 0ms", () => {
    expect(calculateTotalPrice(0, 100)).toBe(0);
  });

  it("charges the full hourly price for one hour", () => {
    expect(calculateTotalPrice(3600000, 100)).toBe(100);
  });

  it("charges half the hourly price for 30 minutes", () => {
    expect(calculateTotalPrice(1800000, 100)).toBe(50);
  });
});

describe("summarizeExactTime", () => {
  it("compares rounded, exact and difference for a paused stopwatch with laps", () => {
    const stopwatch = {
      isRunning: false,
      startTimestamp: null,
      currentLapTime: 0,
      laps: [{ lapTime: 1999 }, { lapTime: 1999 }, { lapTime: 1999 }],
    };

    const summary = summarizeExactTime(stopwatch, 3600);

    // rounded: trunc(1999)*3 = 3000 ; exact: 5997 ; diff: 2997
    expect(summary.rounded.time).toBe(3000);
    expect(summary.exact.time).toBe(5997);
    expect(summary.difference.time).toBe(2997);

    // price = (ms / 3600000) * 3600 = ms / 1000
    expect(summary.rounded.price).toBeCloseTo(3);
    expect(summary.exact.price).toBeCloseTo(5.997);
    expect(summary.difference.price).toBeCloseTo(2.997);
  });

  it("reports zero difference when every segment lands on a whole second", () => {
    const stopwatch = {
      isRunning: false,
      startTimestamp: null,
      currentLapTime: 3000,
      laps: [{ lapTime: 1000 }, { lapTime: 2000 }],
    };

    const summary = summarizeExactTime(stopwatch, 3600);

    expect(summary.rounded.time).toBe(6000);
    expect(summary.exact.time).toBe(6000);
    expect(summary.difference.time).toBe(0);
    expect(summary.difference.price).toBe(0);
  });

  it("captures the dropped sub-second when there are no laps", () => {
    const stopwatch = {
      isRunning: false,
      startTimestamp: null,
      currentLapTime: 1750,
      laps: [],
    };

    const summary = summarizeExactTime(stopwatch, 3600);

    expect(summary.rounded.time).toBe(1000);
    expect(summary.exact.time).toBe(1750);
    expect(summary.difference.time).toBe(750);
  });
});

describe("roundDownToMinute", () => {
  it("returns 0 for 0", () => {
    expect(roundDownToMinute(0)).toBe(0);
  });

  it("floors a sub-minute value to 0", () => {
    expect(roundDownToMinute(45_000)).toBe(0);
  });

  it("floors down to the whole minute", () => {
    expect(roundDownToMinute(12 * 60_000 + 34_000)).toBe(12 * 60_000);
  });

  it("steps a full minute down when already on an exact minute", () => {
    expect(roundDownToMinute(12 * 60_000)).toBe(11 * 60_000);
  });

  it("does not go below 0 from an exact minute", () => {
    expect(roundDownToMinute(0)).toBe(0);
  });
});

describe("roundUpToMinute", () => {
  it("ceils a sub-minute value up to one minute", () => {
    expect(roundUpToMinute(45_000)).toBe(60_000);
  });

  it("ceils up to the next whole minute", () => {
    expect(roundUpToMinute(12 * 60_000 + 34_000)).toBe(13 * 60_000);
  });

  it("steps a full minute up when already on an exact minute", () => {
    expect(roundUpToMinute(12 * 60_000)).toBe(13 * 60_000);
  });

  it("goes to one minute from 0", () => {
    expect(roundUpToMinute(0)).toBe(60_000);
  });
});
