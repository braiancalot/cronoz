import { describe, it, expect } from "vitest";
import fc from "fast-check";
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
import {
  REAL_TIME_STATUS,
  calculateRealTime,
  getRealTimeStatus,
} from "@/lib/realTime.js";
import { RECOVERY_GRACE_PERIOD, calculateTotalTime } from "@/lib/stopwatch.js";

const T0 = 1_700_000_000_000;
const NUM_RUNS = 2000;

// Everything the user can do to a stopwatch, plus the clock moving and the
// heartbeat/recovery the app runs on its own. Lap indexes wrap around the
// current list, so every generated op is applicable.
const opArb = fc.oneof(
  {
    weight: 4,
    arbitrary: fc.record({
      type: fc.constant("wait"),
      ms: fc.integer({ min: 0, max: 90_000 }),
    }),
  },
  { weight: 3, arbitrary: fc.record({ type: fc.constant("start") }) },
  { weight: 3, arbitrary: fc.record({ type: fc.constant("pause") }) },
  { weight: 2, arbitrary: fc.record({ type: fc.constant("heartbeat") }) },
  { weight: 1, arbitrary: fc.record({ type: fc.constant("recover") }) },
  { weight: 2, arbitrary: fc.record({ type: fc.constant("lap") }) },
  {
    weight: 2,
    arbitrary: fc.record({ type: fc.constant("deleteLap"), index: fc.nat() }),
  },
  {
    weight: 1,
    arbitrary: fc.record({ type: fc.constant("restoreLap"), index: fc.nat() }),
  },
  {
    weight: 2,
    arbitrary: fc.record({
      type: fc.constant("adjust"),
      value: fc.integer({ min: -10_000, max: 7_200_000 }),
    }),
  },
  { weight: 2, arbitrary: fc.record({ type: fc.constant("discard") }) },
  { weight: 1, arbitrary: fc.record({ type: fc.constant("undoDiscard") }) },
);

const opsArb = fc.array(opArb, { maxLength: 80 });

const EDITS = new Set([
  "deleteLap",
  "restoreLap",
  "adjust",
  "discard",
  "undoDiscard",
]);

function freshStopwatch() {
  return {
    startTimestamp: null,
    currentLapTime: 0,
    isRunning: false,
    lastActiveAt: null,
    laps: [],
    realTime: 0,
    editedTime: 0,
  };
}

function pick(laps, index) {
  return laps.length === 0 ? null : laps[index % laps.length];
}

// Plays the ops through the real transitions. `discards` mirrors the undo
// toasts: each discard leaves an amount that a later undo can give back.
function play(ops, { onStep } = {}) {
  let stopwatch = freshStopwatch();
  let now = T0;
  let lapCount = 0;
  const discards = [];

  for (const op of ops) {
    const before = stopwatch;
    switch (op.type) {
      case "wait":
        now += op.ms;
        break;
      case "start":
        stopwatch = startRun(stopwatch, now);
        break;
      case "pause":
        stopwatch = pauseRun(stopwatch, now);
        break;
      case "heartbeat":
        stopwatch = heartbeat(stopwatch, now);
        break;
      case "recover":
        stopwatch = recoverStaleRun(stopwatch, now);
        break;
      case "lap":
        stopwatch = appendLap(
          stopwatch,
          { id: `lap-${lapCount++}`, name: "v", createdAt: now },
          now,
        );
        break;
      case "deleteLap": {
        const target = pick(stopwatch.laps, op.index);
        if (target) stopwatch = markLapDeleted(stopwatch, target.id, now);
        break;
      }
      case "restoreLap": {
        const target = pick(stopwatch.laps, op.index);
        if (target) stopwatch = restoreLap(stopwatch, target.id);
        break;
      }
      case "adjust":
        stopwatch = adjustCurrent(stopwatch, op.value, now);
        break;
      case "discard":
        discards.push(pauseRun(stopwatch, now).currentLapTime);
        stopwatch = discardCurrent(stopwatch, now);
        break;
      case "undoDiscard":
        if (discards.length > 0)
          stopwatch = restoreDiscarded(stopwatch, discards.pop());
        break;
    }
    onStep?.({ op, before, after: stopwatch, now });
  }

  return { stopwatch, now };
}

// What the real time must be, derived only from when the clock ran, with no
// knowledge of currentLapTime, laps or edits.
function referenceModel(ops) {
  let now = T0;
  let isRunning = false;
  let start = null;
  let lastActive = null;
  let real = 0;

  const close = (end) => {
    real += Math.max(0, end - start);
    isRunning = false;
    start = null;
    lastActive = null;
  };

  for (const op of ops) {
    if (op.type === "wait") now += op.ms;
    if (op.type === "start" && !isRunning) {
      isRunning = true;
      start = now;
      lastActive = now;
    }
    if (op.type === "heartbeat" && isRunning) lastActive = now;
    if (
      op.type === "recover" &&
      isRunning &&
      now - lastActive >= RECOVERY_GRACE_PERIOD
    ) {
      close(lastActive);
    }
    if (["pause", "lap", "adjust", "discard"].includes(op.type) && isRunning) {
      close(now);
    }
  }

  const stale = isRunning && now - lastActive >= RECOVERY_GRACE_PERIOD;
  const openRun = isRunning ? (stale ? lastActive : now) - start : 0;
  return { stored: real, shown: real + openRun };
}

// The same session with every edit taken out. An edit that would have closed
// an open run (adjust, discard) becomes the pause it implies.
function withoutEdits(ops) {
  return ops
    .filter(
      (op) =>
        op.type !== "undoDiscard" &&
        op.type !== "deleteLap" &&
        op.type !== "restoreLap",
    )
    .map((op) => (EDITS.has(op.type) ? { type: "pause" } : op));
}

function activeLapSum(stopwatch) {
  return stopwatch.laps
    .filter((l) => !l.deletedAt)
    .reduce((sum, l) => sum + l.lapTime, 0);
}

describe("real time under any sequence of operations", () => {
  it("matches a reference that only knows when the clock ran", () => {
    fc.assert(
      fc.property(opsArb, (ops) => {
        const { stopwatch, now } = play(ops);
        const expected = referenceModel(ops);
        expect(stopwatch.realTime).toBe(expected.stored);
        expect(calculateRealTime(stopwatch, now)).toBe(expected.shown);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("is the same with or without the edits", () => {
    fc.assert(
      fc.property(opsArb, (ops) => {
        const edited = play(ops);
        const plain = play(withoutEdits(ops));
        expect(edited.now).toBe(plain.now);
        expect(calculateRealTime(edited.stopwatch, edited.now)).toBe(
          calculateRealTime(plain.stopwatch, plain.now),
        );
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("equals the total in use when nothing was edited", () => {
    const noEditsArb = opsArb.map((ops) =>
      ops.filter((op) => !EDITS.has(op.type)),
    );
    fc.assert(
      fc.property(noEditsArb, (ops) => {
        const { stopwatch, now } = play(ops);
        expect(stopwatch.editedTime).toBe(0);
        expect(calculateRealTime(stopwatch, now)).toBe(
          calculateTotalTime(stopwatch, { now }),
        );
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("stays consistent after every single step", () => {
    fc.assert(
      fc.property(opsArb, (ops) => {
        play(ops, {
          onStep: ({ after }) => {
            expect(getRealTimeStatus(after)).toBe(REAL_TIME_STATUS.tracked);
            expect(activeLapSum(after) + after.currentLapTime).toBe(
              after.realTime + after.editedTime,
            );
          },
        });
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("never goes down, and only edits move the edited time", () => {
    fc.assert(
      fc.property(opsArb, (ops) => {
        play(ops, {
          onStep: ({ op, before, after }) => {
            expect(after.realTime).toBeGreaterThanOrEqual(before.realTime);
            if (!EDITS.has(op.type)) {
              expect(after.editedTime).toBe(before.editedTime);
            }
          },
        });
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("never lets the times go negative", () => {
    fc.assert(
      fc.property(opsArb, (ops) => {
        play(ops, {
          onStep: ({ after }) => {
            expect(after.currentLapTime).toBeGreaterThanOrEqual(0);
            expect(after.realTime).toBeGreaterThanOrEqual(0);
            for (const l of after.laps)
              expect(l.lapTime).toBeGreaterThanOrEqual(0);
          },
        });
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("never adds the fields to a stopwatch stored before they existed", () => {
    fc.assert(
      fc.property(opsArb, (ops) => {
        const { realTime: _r, editedTime: _e, ...legacy } = freshStopwatch();
        let stopwatch = { ...legacy, currentLapTime: 5000 };
        let now = T0;
        for (const op of ops) {
          if (op.type === "wait") now += op.ms;
          if (op.type === "start") stopwatch = startRun(stopwatch, now);
          if (op.type === "pause") stopwatch = pauseRun(stopwatch, now);
          if (op.type === "lap")
            stopwatch = appendLap(
              stopwatch,
              { id: crypto.randomUUID(), name: "v", createdAt: now },
              now,
            );
          if (op.type === "adjust")
            stopwatch = adjustCurrent(stopwatch, op.value, now);
          if (op.type === "discard") stopwatch = discardCurrent(stopwatch, now);
          if (op.type === "undoDiscard")
            stopwatch = restoreDiscarded(stopwatch, 1000);
          if (op.type === "deleteLap" && stopwatch.laps.length > 0)
            stopwatch = markLapDeleted(
              stopwatch,
              pick(stopwatch.laps, op.index).id,
              now,
            );
          if (op.type === "restoreLap" && stopwatch.laps.length > 0)
            stopwatch = restoreLap(
              stopwatch,
              pick(stopwatch.laps, op.index).id,
            );
        }
        expect(stopwatch).not.toHaveProperty("realTime");
        expect(stopwatch).not.toHaveProperty("editedTime");
        expect(getRealTimeStatus(stopwatch)).toBe(REAL_TIME_STATUS.untracked);
      }),
      { numRuns: 500 },
    );
  });
});

describe("real time: hand-picked sessions", () => {
  it("delete a minute, give back 30 seconds: real time is untouched", () => {
    const { stopwatch } = play([
      { type: "start" },
      { type: "wait", ms: 120_000 },
      { type: "heartbeat" },
      { type: "pause" },
      { type: "adjust", value: 60_000 },
      { type: "adjust", value: 90_000 },
    ]);
    expect(stopwatch.currentLapTime).toBe(90_000);
    expect(stopwatch.realTime).toBe(120_000);
    expect(stopwatch.editedTime).toBe(-30_000);
  });

  it("a deleted lap still counts as real time, and undo does not double it", () => {
    const { stopwatch } = play([
      { type: "start" },
      { type: "wait", ms: 10_000 },
      { type: "lap" },
      { type: "start" },
      { type: "wait", ms: 5000 },
      { type: "pause" },
      { type: "deleteLap", index: 1 },
      { type: "restoreLap", index: 1 },
      { type: "deleteLap", index: 1 },
    ]);
    expect(stopwatch.realTime).toBe(15_000);
    expect(activeLapSum(stopwatch) + stopwatch.currentLapTime).toBe(5000);
  });

  it("discard while running, run again, undo: no second is lost", () => {
    const { stopwatch } = play([
      { type: "start" },
      { type: "wait", ms: 8000 },
      { type: "discard" },
      { type: "start" },
      { type: "wait", ms: 3000 },
      { type: "pause" },
      { type: "undoDiscard" },
    ]);
    expect(stopwatch.currentLapTime).toBe(11_000);
    expect(stopwatch.realTime).toBe(11_000);
    expect(stopwatch.editedTime).toBe(0);
  });

  it("a device that died stops counting at its last heartbeat", () => {
    const { stopwatch } = play([
      { type: "start" },
      { type: "wait", ms: 20_000 },
      { type: "heartbeat" },
      { type: "wait", ms: 600_000 },
      { type: "recover" },
    ]);
    expect(stopwatch.realTime).toBe(20_000);
    expect(stopwatch.isRunning).toBe(false);
  });
});
