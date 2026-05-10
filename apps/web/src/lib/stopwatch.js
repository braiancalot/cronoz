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
  const elapsed = isRunning && startTimestamp ? Date.now() - startTimestamp : 0;
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
  const elapsed = isRunning && startTimestamp ? Date.now() - startTimestamp : 0;
  const split = currentLapTime + elapsed;

  return ignoreMs ? truncateToSecond(split) : split;
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
