import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  REAL_TIME_STATUS,
  addEditedTime,
  addRealTime,
  calculateRealTime,
  getRealTimeStatus,
  summarizeRealTime,
} from "@/lib/realTime.js";
import { RECOVERY_GRACE_PERIOD } from "@/lib/stopwatch.js";

const NOW = 1_000_000;

function lap(lapTime, overrides = {}) {
  return {
    id: crypto.randomUUID(),
    name: "Volta",
    lapTime,
    createdAt: 0,
    ...overrides,
  };
}

function tracked(overrides = {}) {
  return {
    startTimestamp: null,
    currentLapTime: 0,
    isRunning: false,
    lastActiveAt: null,
    laps: [],
    realTime: 0,
    editedTime: 0,
    ...overrides,
  };
}

function untracked(overrides = {}) {
  const { realTime: _r, editedTime: _e, ...rest } = tracked(overrides);
  return rest;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getRealTimeStatus", () => {
  it("is untracked for a stopwatch stored before the fields existed", () => {
    expect(getRealTimeStatus(untracked({ currentLapTime: 5000 }))).toBe(
      REAL_TIME_STATUS.untracked,
    );
  });

  it("is untracked for a missing stopwatch", () => {
    expect(getRealTimeStatus(undefined)).toBe(REAL_TIME_STATUS.untracked);
  });

  it("is tracked for a fresh stopwatch", () => {
    expect(getRealTimeStatus(tracked())).toBe(REAL_TIME_STATUS.tracked);
  });

  it("is tracked when laps and current time add up to real plus edited", () => {
    const stopwatch = tracked({
      laps: [lap(3000), lap(2000)],
      currentLapTime: 1500,
      realTime: 7000,
      editedTime: -500,
    });
    expect(getRealTimeStatus(stopwatch)).toBe(REAL_TIME_STATUS.tracked);
  });

  it("leaves deleted laps out of the sum", () => {
    const stopwatch = tracked({
      laps: [lap(3000), lap(2000, { deletedAt: 5 })],
      currentLapTime: 0,
      realTime: 5000,
      editedTime: -2000,
    });
    expect(getRealTimeStatus(stopwatch)).toBe(REAL_TIME_STATUS.tracked);
  });

  it("ignores the running elapsed, which neither side has stored yet", () => {
    const stopwatch = tracked({
      isRunning: true,
      startTimestamp: NOW - 60_000,
      lastActiveAt: NOW,
      currentLapTime: 1000,
      realTime: 1000,
    });
    expect(getRealTimeStatus(stopwatch)).toBe(REAL_TIME_STATUS.tracked);
  });

  it("is inconsistent when an older build paused without adding real time", () => {
    const stopwatch = tracked({ currentLapTime: 4000, realTime: 0 });
    expect(getRealTimeStatus(stopwatch)).toBe(REAL_TIME_STATUS.inconsistent);
  });

  it("is inconsistent when an older build adjusted without recording the edit", () => {
    const stopwatch = tracked({ currentLapTime: 9000, realTime: 4000 });
    expect(getRealTimeStatus(stopwatch)).toBe(REAL_TIME_STATUS.inconsistent);
  });

  it("is inconsistent when an older build deleted a lap without recording the edit", () => {
    const stopwatch = tracked({
      laps: [lap(3000, { deletedAt: 5 })],
      realTime: 3000,
    });
    expect(getRealTimeStatus(stopwatch)).toBe(REAL_TIME_STATUS.inconsistent);
  });

  it("is inconsistent when only one of the two fields exists", () => {
    const { editedTime: _e, ...onlyReal } = tracked();
    const { realTime: _r, ...onlyEdited } = tracked();
    expect(getRealTimeStatus(onlyReal)).toBe(REAL_TIME_STATUS.inconsistent);
    expect(getRealTimeStatus(onlyEdited)).toBe(REAL_TIME_STATUS.inconsistent);
  });

  it("is inconsistent when a field is not a finite number", () => {
    expect(getRealTimeStatus(tracked({ realTime: Number.NaN }))).toBe(
      REAL_TIME_STATUS.inconsistent,
    );
    expect(getRealTimeStatus(tracked({ editedTime: null }))).toBe(
      REAL_TIME_STATUS.inconsistent,
    );
  });

  it("is inconsistent for a negative real time", () => {
    const stopwatch = tracked({ realTime: -1000, editedTime: 1000 });
    expect(getRealTimeStatus(stopwatch)).toBe(REAL_TIME_STATUS.inconsistent);
  });

  it("is inconsistent for a gap of a whole millisecond", () => {
    const stopwatch = tracked({ currentLapTime: 1001, realTime: 1000 });
    expect(getRealTimeStatus(stopwatch)).toBe(REAL_TIME_STATUS.inconsistent);
  });

  it("tolerates float noise below a millisecond", () => {
    const stopwatch = tracked({
      laps: [lap(0.1), lap(0.2)],
      realTime: 0.3,
    });
    expect(getRealTimeStatus(stopwatch)).toBe(REAL_TIME_STATUS.tracked);
  });
});

describe("calculateRealTime", () => {
  it("is the stored real time while paused", () => {
    expect(calculateRealTime(tracked({ realTime: 4200 }), NOW)).toBe(4200);
  });

  it("adds the running elapsed", () => {
    const stopwatch = tracked({
      isRunning: true,
      startTimestamp: NOW - 2500,
      lastActiveAt: NOW,
      realTime: 4000,
    });
    expect(calculateRealTime(stopwatch, NOW)).toBe(6500);
  });

  it("defaults to the current clock", () => {
    const stopwatch = tracked({
      isRunning: true,
      startTimestamp: NOW - 2500,
      lastActiveAt: NOW,
    });
    expect(calculateRealTime(stopwatch)).toBe(2500);
  });

  it("caps a stale run at the last heartbeat, like the total does", () => {
    const stopwatch = tracked({
      isRunning: true,
      startTimestamp: NOW - 120_000,
      lastActiveAt: NOW - 100_000,
      realTime: 1000,
    });
    expect(calculateRealTime(stopwatch, NOW)).toBe(21_000);
  });

  it("does not cap a run inside the grace period", () => {
    const stopwatch = tracked({
      isRunning: true,
      startTimestamp: NOW - 50_000,
      lastActiveAt: NOW - RECOVERY_GRACE_PERIOD + 1,
    });
    expect(calculateRealTime(stopwatch, NOW)).toBe(50_000);
  });

  it("ignores edits: the adjusted current time does not leak in", () => {
    const stopwatch = tracked({ currentLapTime: 60_000, realTime: 5000 });
    expect(calculateRealTime(stopwatch, NOW)).toBe(5000);
  });

  it("is null for an untracked stopwatch", () => {
    expect(calculateRealTime(untracked({ currentLapTime: 5000 }), NOW)).toBe(
      null,
    );
  });
});

describe("addRealTime / addEditedTime", () => {
  it("adds to the real time of a tracked stopwatch", () => {
    expect(addRealTime(tracked({ realTime: 100 }), 50).realTime).toBe(150);
  });

  it("adds a signed delta to the edited time", () => {
    expect(addEditedTime(tracked({ editedTime: 100 }), -300).editedTime).toBe(
      -200,
    );
  });

  it("returns an untracked stopwatch unchanged, without adding the fields", () => {
    const stopwatch = untracked({ currentLapTime: 5000 });
    expect(addRealTime(stopwatch, 50)).toBe(stopwatch);
    expect(addEditedTime(stopwatch, 50)).toBe(stopwatch);
    expect(addRealTime(stopwatch, 50)).not.toHaveProperty("realTime");
  });

  it("does not repair a half-tracked stopwatch", () => {
    const { editedTime: _e, ...onlyReal } = tracked({ realTime: 10 });
    expect(addRealTime(onlyReal, 50)).toBe(onlyReal);
    expect(addEditedTime(onlyReal, 50)).toBe(onlyReal);
  });

  it("does not mutate the input", () => {
    const stopwatch = tracked({ realTime: 100, editedTime: 0 });
    addRealTime(stopwatch, 50);
    addEditedTime(stopwatch, 50);
    expect(stopwatch).toEqual(tracked({ realTime: 100, editedTime: 0 }));
  });
});

describe("summarizeRealTime", () => {
  it("compares the total in use with the real time, priced by the hour", () => {
    const stopwatch = tracked({
      laps: [lap(1_800_000)],
      currentLapTime: 1_800_000,
      realTime: 1_200_000,
      editedTime: 2_400_000,
    });
    const summary = summarizeRealTime(stopwatch, 100, { ignoreMs: false });

    expect(summary.status).toBe(REAL_TIME_STATUS.tracked);
    expect(summary.inUse).toEqual({ time: 3_600_000, price: 100 });
    expect(summary.real.time).toBe(1_200_000);
    expect(summary.real.price).toBeCloseTo(100 / 3);
    expect(summary.difference.time).toBe(2_400_000);
    expect(summary.difference.price).toBeCloseTo(200 / 3);
  });

  it("reports a negative difference when edits removed time", () => {
    const stopwatch = tracked({
      currentLapTime: 1000,
      realTime: 4000,
      editedTime: -3000,
    });
    const summary = summarizeRealTime(stopwatch, 3600, { ignoreMs: false });
    expect(summary.difference.time).toBe(-3000);
    expect(summary.difference.price).toBeCloseTo(-3);
  });

  it("uses the rounded total when milliseconds are ignored", () => {
    const stopwatch = tracked({
      laps: [lap(1999)],
      currentLapTime: 1999,
      realTime: 3998,
    });
    const summary = summarizeRealTime(stopwatch, 3600, { ignoreMs: true });
    expect(summary.inUse.time).toBe(2000);
    expect(summary.real.time).toBe(3998);
    expect(summary.difference.time).toBe(-1998);
  });

  it("carries the status and no numbers when the real time is unknown", () => {
    const summary = summarizeRealTime(untracked(), 3600, { ignoreMs: false });
    expect(summary).toEqual({ status: REAL_TIME_STATUS.untracked });
  });

  it("does not show numbers for an inconsistent stopwatch", () => {
    const stopwatch = tracked({ currentLapTime: 4000 });
    const summary = summarizeRealTime(stopwatch, 3600, { ignoreMs: false });
    expect(summary).toEqual({ status: REAL_TIME_STATUS.inconsistent });
  });
});
