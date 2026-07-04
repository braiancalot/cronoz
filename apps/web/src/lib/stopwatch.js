// A running stopwatch writes a heartbeat (lastActiveAt) every ~10s. If the
// newest heartbeat is older than this, the run was abandoned (the device that
// was ticking died) and its elapsed time should be capped at the last heartbeat
// rather than kept growing. Single source of truth — also used by useProject's
// recovery so the Home list and the project page agree on the displayed time.
export const RECOVERY_GRACE_PERIOD = 30_000;

export function isStopwatchLive(stopwatch, now = Date.now()) {
  return Boolean(
    stopwatch?.isRunning &&
    stopwatch.lastActiveAt &&
    now - stopwatch.lastActiveAt < RECOVERY_GRACE_PERIOD,
  );
}

export function isStopwatchStale(stopwatch, now = Date.now()) {
  return Boolean(
    stopwatch?.isRunning &&
    stopwatch.lastActiveAt &&
    now - stopwatch.lastActiveAt >= RECOVERY_GRACE_PERIOD,
  );
}

export function formatTime(ms) {
  const hours = Math.floor(ms / 3600000)
    .toString()
    .padStart(2, "0");

  const minutes = Math.floor((ms / 60000) % 60)
    .toString()
    .padStart(2, "0");

  const seconds = Math.floor((ms / 1000) % 60)
    .toString()
    .padStart(2, "0");

  const milliseconds = Math.floor((ms % 1000) / 10)
    .toString()
    .padStart(2, "0");

  return { hours, minutes, seconds, milliseconds };
}

export function sumLapTimes(laps) {
  return laps.reduce((sum, lap) => sum + lap.lapTime, 0);
}

export function calculateTotalTime(stopwatch, { ignoreMs = false } = {}) {
  if (!stopwatch) return 0;

  const { isRunning, startTimestamp, currentLapTime, laps } = stopwatch;
  const now = Date.now();
  // Cap the running elapsed at lastActiveAt once the heartbeat goes stale, so an
  // abandoned run stops growing — matches what useProject's recovery commits.
  const end = isStopwatchStale(stopwatch, now) ? stopwatch.lastActiveAt : now;
  const elapsed = isRunning && startTimestamp ? end - startTimestamp : 0;
  const inProgress = currentLapTime + elapsed;

  if (!ignoreMs) {
    return sumLapTimes(laps) + inProgress;
  }

  const lapsTotal = laps.reduce(
    (sum, lap) => sum + truncateToSecond(lap.lapTime),
    0,
  );
  return lapsTotal + truncateToSecond(inProgress);
}

export function calculateSplitTime(stopwatch, { ignoreMs = false } = {}) {
  if (!stopwatch) return 0;

  const { isRunning, startTimestamp, currentLapTime } = stopwatch;
  const now = Date.now();
  const end = isStopwatchStale(stopwatch, now) ? stopwatch.lastActiveAt : now;
  const elapsed = isRunning && startTimestamp ? end - startTimestamp : 0;
  const split = currentLapTime + elapsed;

  return ignoreMs ? truncateToSecond(split) : split;
}

// Segment + total to show while adjusting, with the in-progress segment
// replaced by `segment`. Routes through the same calc functions as the live
// display so the "ignore ms" per-lap truncation matches exactly — otherwise a
// raw lap sum over-counts the dropped sub-second remainders.
export function adjustPreview(stopwatch, segment, { ignoreMs = false } = {}) {
  const paused = {
    ...stopwatch,
    isRunning: false,
    startTimestamp: null,
    currentLapTime: segment,
  };
  return {
    segment: calculateSplitTime(paused, { ignoreMs }),
    total: calculateTotalTime(paused, { ignoreMs }),
  };
}

export function hasHours(hours) {
  return hours !== "00";
}

export function formatTimeCompact(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms / 60000) % 60);
  const seconds = Math.floor((ms / 1000) % 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`;
  }

  const parts = [];
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);
  return parts.length > 0 ? parts.join("") : "0s";
}

export function truncateToSecond(ms) {
  return Math.floor(ms / 1000) * 1000;
}

// Snap to a whole minute, always landing on a different mark: with a
// sub-minute remainder it floors/ceils, and when already on an exact minute it
// steps a full minute like the ±1m buttons. Clamped at 0.
export function roundDownToMinute(ms) {
  return Math.max(0, (Math.ceil(ms / 60000) - 1) * 60000);
}

export function roundUpToMinute(ms) {
  return (Math.floor(ms / 60000) + 1) * 60000;
}
