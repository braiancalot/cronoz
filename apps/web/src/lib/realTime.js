import {
  calculateTotalPrice,
  calculateTotalTime,
  runningElapsed,
  sumLapTimes,
} from "@/lib/stopwatch.js";

// `realTime` is how long the clock actually ran. `editedTime` is the net time
// the user added or removed by adjusting, discarding or deleting laps. The two
// MUST add up to the time in use, so a record touched by a build that predates
// them shows as inconsistent instead of as a wrong number.
export const REAL_TIME_STATUS = Object.freeze({
  tracked: "tracked",
  untracked: "untracked",
  inconsistent: "inconsistent",
});

// Sums of float lap times may drift by a fraction of a millisecond.
const CONSISTENCY_TOLERANCE_MS = 1;

function isTracked(stopwatch) {
  return (
    Number.isFinite(stopwatch?.realTime) &&
    Number.isFinite(stopwatch?.editedTime)
  );
}

function storedTimeInUse({ laps, currentLapTime }) {
  return sumLapTimes(laps.filter((lap) => !lap.deletedAt)) + currentLapTime;
}

export function getRealTimeStatus(stopwatch) {
  if (!stopwatch) return REAL_TIME_STATUS.untracked;

  const hasNeither = !("realTime" in stopwatch) && !("editedTime" in stopwatch);
  if (hasNeither) return REAL_TIME_STATUS.untracked;
  if (!isTracked(stopwatch) || stopwatch.realTime < 0) {
    return REAL_TIME_STATUS.inconsistent;
  }

  const gap =
    storedTimeInUse(stopwatch) - (stopwatch.realTime + stopwatch.editedTime);
  return Math.abs(gap) < CONSISTENCY_TOLERANCE_MS
    ? REAL_TIME_STATUS.tracked
    : REAL_TIME_STATUS.inconsistent;
}

export function calculateRealTime(stopwatch, now = Date.now()) {
  if (!isTracked(stopwatch)) return null;
  return stopwatch.realTime + runningElapsed(stopwatch, now);
}

// Both return an untracked stopwatch as is: a project created before the
// fields existed has no known real time, and MUST NOT start one mid-way.
export function addRealTime(stopwatch, delta) {
  if (!isTracked(stopwatch)) return stopwatch;
  return { ...stopwatch, realTime: stopwatch.realTime + delta };
}

export function addEditedTime(stopwatch, delta) {
  if (!isTracked(stopwatch)) return stopwatch;
  return { ...stopwatch, editedTime: stopwatch.editedTime + delta };
}

function priced(time, hourlyPrice) {
  return { time, price: calculateTotalPrice(time, hourlyPrice) };
}

// Snapshot for the real time panel: the total in use (rounded like the
// display) against what the clock actually ran.
export function summarizeRealTime(stopwatch, hourlyPrice, { ignoreMs }) {
  const status = getRealTimeStatus(stopwatch);
  if (status !== REAL_TIME_STATUS.tracked) return { status };

  const inUse = calculateTotalTime(stopwatch, { ignoreMs });
  const real = calculateRealTime(stopwatch);

  return {
    status,
    inUse: priced(inUse, hourlyPrice),
    real: priced(real, hourlyPrice),
    difference: priced(inUse - real, hourlyPrice),
  };
}
