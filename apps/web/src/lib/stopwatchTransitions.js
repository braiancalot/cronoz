import { MAX_LAPS_PER_PROJECT } from "@cronoz/shared";
import { addEditedTime, addRealTime } from "@/lib/realTime.js";
import { isStopwatchStale } from "@/lib/stopwatch.js";

// Every change a stopwatch can go through, as pure functions of the stored
// record. Each one keeps currentLapTime, realTime and editedTime moving
// together: a run that closes adds to the first two, an edit to the first and
// the last. A no-op returns the same object, so callers can skip the write.

// Closes the open run at `end`. Clamped at 0 so a clock skew between the
// device that started the run and the one ending it cannot remove time.
function settleRun(stopwatch, end) {
  const { startTimestamp, currentLapTime } = stopwatch;
  const elapsed = startTimestamp ? Math.max(0, end - startTimestamp) : 0;

  const paused = {
    ...stopwatch,
    isRunning: false,
    startTimestamp: null,
    lastActiveAt: null,
    currentLapTime: currentLapTime + elapsed,
  };
  return addRealTime(paused, elapsed);
}

export function startRun(stopwatch, now) {
  if (stopwatch.isRunning) return stopwatch;
  return {
    ...stopwatch,
    isRunning: true,
    startTimestamp: now,
    lastActiveAt: now,
  };
}

export function pauseRun(stopwatch, now) {
  if (!stopwatch.isRunning) return stopwatch;
  return settleRun(stopwatch, now);
}

// A run whose heartbeat went stale was abandoned: it ends at the last beat.
export function recoverStaleRun(stopwatch, now) {
  if (!isStopwatchStale(stopwatch, now)) return stopwatch;
  return settleRun(stopwatch, stopwatch.lastActiveAt);
}

export function heartbeat(stopwatch, now) {
  if (!stopwatch.isRunning) return stopwatch;
  return { ...stopwatch, lastActiveAt: now };
}

function setCurrentLapTime(stopwatch, value) {
  const delta = value - stopwatch.currentLapTime;
  if (delta === 0) return stopwatch;
  return addEditedTime({ ...stopwatch, currentLapTime: value }, delta);
}

export function adjustCurrent(stopwatch, value, now) {
  return setCurrentLapTime(pauseRun(stopwatch, now), Math.max(0, value));
}

export function discardCurrent(stopwatch, now) {
  return setCurrentLapTime(pauseRun(stopwatch, now), 0);
}

// Undo of a discard, applied on top of whatever happened since, so a run made
// between the discard and the undo is kept.
export function restoreDiscarded(stopwatch, amount) {
  return setCurrentLapTime(stopwatch, stopwatch.currentLapTime + amount);
}

export function appendLap(stopwatch, { id, name, createdAt }, now) {
  if (stopwatch.laps.length >= MAX_LAPS_PER_PROJECT) return stopwatch;

  const settled = pauseRun(stopwatch, now);
  const lap = { id, name, lapTime: settled.currentLapTime, createdAt };
  return { ...settled, currentLapTime: 0, laps: [lap, ...settled.laps] };
}

function setLapDeletedAt(stopwatch, lapId, deletedAt) {
  const target = stopwatch.laps.find((lap) => lap.id === lapId);
  if (!target || Boolean(target.deletedAt) === Boolean(deletedAt)) {
    return stopwatch;
  }

  const laps = stopwatch.laps.map((lap) =>
    lap === target ? { ...lap, deletedAt } : lap,
  );
  const delta = deletedAt ? -target.lapTime : target.lapTime;
  return addEditedTime({ ...stopwatch, laps }, delta);
}

export function markLapDeleted(stopwatch, lapId, now) {
  return setLapDeletedAt(stopwatch, lapId, now);
}

export function restoreLap(stopwatch, lapId) {
  return setLapDeletedAt(stopwatch, lapId, null);
}
