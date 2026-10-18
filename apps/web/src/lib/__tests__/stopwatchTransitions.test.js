import { describe, it, expect } from "vitest";
import { MAX_LAPS_PER_PROJECT } from "@cronoz/shared";
import {
  adjustCurrent,
  appendLap,
  discardCurrent,
  heartbeat,
  markLapDeleted,
  pauseRun,
  recoverStaleRun,
  restoreDiscarded,
  restoreLap,
  startRun,
} from "@/lib/stopwatchTransitions.js";
import { REAL_TIME_STATUS, getRealTimeStatus } from "@/lib/realTime.js";
import { RECOVERY_GRACE_PERIOD } from "@/lib/stopwatch.js";

const NOW = 1_000_000;
const NEW_LAP = { id: "lap-new", name: "Nova", createdAt: NOW };

function lap(id, lapTime, overrides = {}) {
  return { id, name: id, lapTime, createdAt: 0, ...overrides };
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

function running(startedAgo, overrides = {}) {
  return tracked({
    isRunning: true,
    startTimestamp: NOW - startedAgo,
    lastActiveAt: NOW,
    ...overrides,
  });
}

function expectTracked(sw) {
  expect(getRealTimeStatus(sw)).toBe(REAL_TIME_STATUS.tracked);
}

describe("startRun", () => {
  it("starts the clock and the heartbeat", () => {
    const next = startRun(tracked({ currentLapTime: 500, realTime: 500 }), NOW);
    expect(next).toMatchObject({
      isRunning: true,
      startTimestamp: NOW,
      lastActiveAt: NOW,
      currentLapTime: 500,
      realTime: 500,
      editedTime: 0,
    });
  });

  it("is a no-op on a clock that is already running, so the open run is kept", () => {
    const sw = running(5000);
    expect(startRun(sw, NOW + 1000)).toBe(sw);
  });

  it("does not add the fields to an untracked stopwatch", () => {
    const next = startRun(untracked(), NOW);
    expect(next).not.toHaveProperty("realTime");
    expect(next).not.toHaveProperty("editedTime");
  });
});

describe("pauseRun", () => {
  it("adds the elapsed run to both the current time and the real time", () => {
    const next = pauseRun(
      running(2500, {
        currentLapTime: 1000,
        realTime: 7000,
        editedTime: -6000,
      }),
      NOW,
    );
    expect(next).toEqual(
      tracked({ currentLapTime: 3500, realTime: 9500, editedTime: -6000 }),
    );
    expectTracked(next);
  });

  it("is a no-op on a paused clock", () => {
    const sw = tracked({ currentLapTime: 1000, realTime: 1000 });
    expect(pauseRun(sw, NOW)).toBe(sw);
  });

  it("counts the whole run, even past a stale heartbeat (same as before)", () => {
    const sw = running(120_000, { lastActiveAt: NOW - 100_000 });
    const next = pauseRun(sw, NOW);
    expect(next.currentLapTime).toBe(120_000);
    expect(next.realTime).toBe(120_000);
  });

  it("clamps a run that ends before it starts to zero (clock skew)", () => {
    const sw = tracked({
      isRunning: true,
      startTimestamp: NOW + 5000,
      lastActiveAt: NOW,
      currentLapTime: 1000,
      realTime: 1000,
    });
    const next = pauseRun(sw, NOW);
    expect(next.currentLapTime).toBe(1000);
    expect(next.realTime).toBe(1000);
  });

  it("adds nothing for a running flag without a start timestamp", () => {
    const sw = tracked({
      isRunning: true,
      currentLapTime: 1000,
      realTime: 1000,
    });
    const next = pauseRun(sw, NOW);
    expect(next).toEqual(tracked({ currentLapTime: 1000, realTime: 1000 }));
  });

  it("pausing twice from the same snapshot does not count the run twice", () => {
    const sw = running(2000);
    const first = pauseRun(sw, NOW);
    expect(pauseRun(first, NOW + 5000)).toBe(first);
  });

  it("keeps an untracked stopwatch untracked", () => {
    const next = pauseRun(
      untracked({ isRunning: true, startTimestamp: NOW - 2000 }),
      NOW,
    );
    expect(next.currentLapTime).toBe(2000);
    expect(next).not.toHaveProperty("realTime");
  });

  it("does not mutate the input", () => {
    const sw = running(2000);
    const copy = structuredClone(sw);
    pauseRun(sw, NOW);
    expect(sw).toEqual(copy);
  });
});

describe("recoverStaleRun", () => {
  it("settles a dead run at its last heartbeat", () => {
    const sw = running(120_000, {
      lastActiveAt: NOW - 100_000,
      currentLapTime: 500,
      realTime: 500,
    });
    const next = recoverStaleRun(sw, NOW);
    expect(next).toEqual(tracked({ currentLapTime: 20_500, realTime: 20_500 }));
    expectTracked(next);
  });

  it("is a no-op while the heartbeat is fresh", () => {
    const sw = running(120_000, {
      lastActiveAt: NOW - RECOVERY_GRACE_PERIOD + 1,
    });
    expect(recoverStaleRun(sw, NOW)).toBe(sw);
  });

  it("recovers exactly at the grace period", () => {
    const sw = running(60_000, { lastActiveAt: NOW - RECOVERY_GRACE_PERIOD });
    expect(recoverStaleRun(sw, NOW).realTime).toBe(
      60_000 - RECOVERY_GRACE_PERIOD,
    );
  });

  it("is a no-op on a paused clock", () => {
    const sw = tracked({ currentLapTime: 5 });
    expect(recoverStaleRun(sw, NOW)).toBe(sw);
  });

  it("is a no-op on a run without a heartbeat", () => {
    const sw = running(5000, { lastActiveAt: null });
    expect(recoverStaleRun(sw, NOW)).toBe(sw);
  });
});

describe("heartbeat", () => {
  it("moves lastActiveAt on a running clock and nothing else", () => {
    const sw = running(5000, { lastActiveAt: NOW - 10_000 });
    expect(heartbeat(sw, NOW)).toEqual({ ...sw, lastActiveAt: NOW });
  });

  it("is a no-op on a paused clock, so it cannot undo a pause", () => {
    const sw = tracked({ currentLapTime: 5000, realTime: 5000 });
    expect(heartbeat(sw, NOW)).toBe(sw);
  });
});

describe("discardCurrent", () => {
  it("zeroes the current time and records it as an edit", () => {
    const sw = tracked({ currentLapTime: 4000, realTime: 4000 });
    const next = discardCurrent(sw, NOW);
    expect(next).toEqual(
      tracked({ currentLapTime: 0, realTime: 4000, editedTime: -4000 }),
    );
    expectTracked(next);
  });

  it("closes a running interval into the real time before discarding", () => {
    const sw = running(3000, { currentLapTime: 1000, realTime: 1000 });
    const next = discardCurrent(sw, NOW);
    expect(next).toEqual(
      tracked({ currentLapTime: 0, realTime: 4000, editedTime: -4000 }),
    );
    expectTracked(next);
  });

  it("keeps the laps", () => {
    const laps = [lap("a", 1000)];
    const sw = tracked({ laps, currentLapTime: 500, realTime: 1500 });
    expect(discardCurrent(sw, NOW).laps).toBe(laps);
  });

  it("discarding nothing changes nothing", () => {
    const sw = tracked({ realTime: 300, editedTime: -300 });
    expect(discardCurrent(sw, NOW)).toEqual(sw);
  });

  it("keeps an untracked stopwatch untracked", () => {
    const next = discardCurrent(untracked({ currentLapTime: 4000 }), NOW);
    expect(next.currentLapTime).toBe(0);
    expect(next).not.toHaveProperty("editedTime");
  });
});

describe("restoreDiscarded", () => {
  it("gives the discarded time back as the reverse edit", () => {
    const discarded = discardCurrent(
      tracked({ currentLapTime: 4000, realTime: 4000 }),
      NOW,
    );
    const next = restoreDiscarded(discarded, 4000);
    expect(next).toEqual(
      tracked({ currentLapTime: 4000, realTime: 4000, editedTime: 0 }),
    );
    expectTracked(next);
  });

  it("keeps a run made between the discard and the undo", () => {
    const discarded = discardCurrent(
      tracked({ currentLapTime: 4000, realTime: 4000 }),
      NOW,
    );
    const ranAgain = pauseRun(startRun(discarded, NOW), NOW + 10_000);
    const next = restoreDiscarded(ranAgain, 4000);
    expect(next.currentLapTime).toBe(14_000);
    expect(next.realTime).toBe(14_000);
    expectTracked(next);
  });

  it("works while running without touching the open interval", () => {
    const discarded = discardCurrent(
      tracked({ currentLapTime: 4000, realTime: 4000 }),
      NOW,
    );
    const runningAgain = startRun(discarded, NOW);
    const next = restoreDiscarded(runningAgain, 4000);
    expect(next).toMatchObject({
      isRunning: true,
      startTimestamp: NOW,
      currentLapTime: 4000,
    });
    expectTracked(next);
  });

  it("is a no-op for an amount of zero", () => {
    const sw = tracked();
    expect(restoreDiscarded(sw, 0)).toBe(sw);
  });

  it("keeps an untracked stopwatch untracked", () => {
    const next = restoreDiscarded(untracked(), 4000);
    expect(next.currentLapTime).toBe(4000);
    expect(next).not.toHaveProperty("editedTime");
  });
});

describe("adjustCurrent", () => {
  it("records a raise as a positive edit", () => {
    const sw = tracked({ currentLapTime: 1000, realTime: 1000 });
    const next = adjustCurrent(sw, 61_000, NOW);
    expect(next).toEqual(
      tracked({ currentLapTime: 61_000, realTime: 1000, editedTime: 60_000 }),
    );
    expectTracked(next);
  });

  it("records a cut as a negative edit", () => {
    const sw = tracked({ currentLapTime: 90_000, realTime: 90_000 });
    const next = adjustCurrent(sw, 30_000, NOW);
    expect(next.editedTime).toBe(-60_000);
    expect(next.realTime).toBe(90_000);
    expectTracked(next);
  });

  it("accumulates successive adjustments", () => {
    const sw = tracked({ currentLapTime: 10_000, realTime: 10_000 });
    const next = adjustCurrent(
      adjustCurrent(adjustCurrent(sw, 70_000, NOW), 5000, NOW),
      20_000,
      NOW,
    );
    expect(next.currentLapTime).toBe(20_000);
    expect(next.editedTime).toBe(10_000);
    expect(next.realTime).toBe(10_000);
    expectTracked(next);
  });

  it("clamps a negative value to zero and records only what was removed", () => {
    const sw = tracked({ currentLapTime: 1000, realTime: 1000 });
    const next = adjustCurrent(sw, -5000, NOW);
    expect(next.currentLapTime).toBe(0);
    expect(next.editedTime).toBe(-1000);
    expectTracked(next);
  });

  it("adjusting to the same value records no edit", () => {
    const sw = tracked({ currentLapTime: 1000, realTime: 1000 });
    expect(adjustCurrent(sw, 1000, NOW)).toEqual(sw);
  });

  it("settles a run that is still open before adjusting", () => {
    const sw = running(5000, { currentLapTime: 1000, realTime: 1000 });
    const next = adjustCurrent(sw, 0, NOW);
    expect(next).toEqual(
      tracked({ currentLapTime: 0, realTime: 6000, editedTime: -6000 }),
    );
  });

  it("keeps an untracked stopwatch untracked", () => {
    const next = adjustCurrent(untracked({ currentLapTime: 1000 }), 5000, NOW);
    expect(next.currentLapTime).toBe(5000);
    expect(next).not.toHaveProperty("editedTime");
  });
});

describe("appendLap", () => {
  it("closes the current time into a new lap on top of the list", () => {
    const old = lap("a", 1000);
    const sw = tracked({ laps: [old], currentLapTime: 2500, realTime: 3500 });
    const next = appendLap(sw, NEW_LAP, NOW);
    expect(next.laps).toEqual([{ ...NEW_LAP, lapTime: 2500 }, old]);
    expect(next.currentLapTime).toBe(0);
    expect(next.realTime).toBe(3500);
    expectTracked(next);
  });

  it("takes the stored time, so an adjusted current time becomes the lap", () => {
    const sw = adjustCurrent(
      tracked({ currentLapTime: 1000, realTime: 1000 }),
      60_000,
      NOW,
    );
    const next = appendLap(sw, NEW_LAP, NOW);
    expect(next.laps[0].lapTime).toBe(60_000);
    expect(next.realTime).toBe(1000);
    expect(next.editedTime).toBe(59_000);
    expectTracked(next);
  });

  it("pauses an open run first instead of counting it twice", () => {
    const sw = running(3000, { currentLapTime: 1000, realTime: 1000 });
    const next = appendLap(sw, NEW_LAP, NOW);
    expect(next.laps[0].lapTime).toBe(4000);
    expect(next).toMatchObject({
      isRunning: false,
      startTimestamp: null,
      currentLapTime: 0,
    });
    expect(next.realTime).toBe(4000);
    expectTracked(next);
  });

  it("is a no-op at the lap limit, deleted laps included", () => {
    const laps = Array.from({ length: MAX_LAPS_PER_PROJECT }, (_, i) =>
      lap(`l${i}`, 0, { deletedAt: i === 0 ? 1 : null }),
    );
    const sw = tracked({ laps, currentLapTime: 1000 });
    expect(appendLap(sw, NEW_LAP, NOW)).toBe(sw);
  });

  it("keeps an untracked stopwatch untracked", () => {
    const next = appendLap(untracked({ currentLapTime: 1000 }), NEW_LAP, NOW);
    expect(next.laps[0].lapTime).toBe(1000);
    expect(next).not.toHaveProperty("realTime");
  });
});

describe("markLapDeleted / restoreLap", () => {
  const laps = [lap("a", 3000), lap("b", 2000)];
  const base = tracked({ laps, currentLapTime: 500, realTime: 5500 });

  it("deleting a lap records its time as a negative edit", () => {
    const next = markLapDeleted(base, "b", NOW);
    expect(next.laps[1]).toEqual({ ...laps[1], deletedAt: NOW });
    expect(next.laps[0]).toBe(laps[0]);
    expect(next.editedTime).toBe(-2000);
    expect(next.realTime).toBe(5500);
    expectTracked(next);
  });

  it("restoring the lap reverses the edit", () => {
    const next = restoreLap(markLapDeleted(base, "b", NOW), "b");
    expect(next.laps[1].deletedAt).toBeNull();
    expect(next.editedTime).toBe(0);
    expectTracked(next);
  });

  it("deleting a lap that is already deleted does not count it twice", () => {
    const once = markLapDeleted(base, "b", NOW);
    expect(markLapDeleted(once, "b", NOW + 1)).toBe(once);
  });

  it("restoring a lap that is not deleted does not count it twice", () => {
    expect(restoreLap(base, "a")).toBe(base);
  });

  it("is a no-op for an unknown lap", () => {
    expect(markLapDeleted(base, "zzz", NOW)).toBe(base);
    expect(restoreLap(base, "zzz")).toBe(base);
  });

  it("keeps a running clock running", () => {
    const sw = running(1000, { laps, realTime: 5000 });
    const next = markLapDeleted(sw, "a", NOW);
    expect(next).toMatchObject({ isRunning: true, startTimestamp: NOW - 1000 });
    expectTracked(next);
  });

  it("keeps an untracked stopwatch untracked", () => {
    const sw = untracked({ laps });
    const next = restoreLap(markLapDeleted(sw, "a", NOW), "a");
    expect(next.laps[0].deletedAt).toBeNull();
    expect(next).not.toHaveProperty("editedTime");
  });
});
