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

export function calculateTotalTime(stopwatch) {
  if (!stopwatch) return 0;

  const { isRunning, startTimestamp, currentLapTime, laps } = stopwatch;
  const lapsTotal = sumLapTimes(laps);
  const elapsed = isRunning && startTimestamp ? Date.now() - startTimestamp : 0;

  return lapsTotal + currentLapTime + elapsed;
}

export function calculateSplitTime(stopwatch) {
  if (!stopwatch) return 0;

  const { isRunning, startTimestamp, currentLapTime } = stopwatch;
  const elapsed = isRunning && startTimestamp ? Date.now() - startTimestamp : 0;

  return currentLapTime + elapsed;
}

export function hasHours(hours) {
  return hours !== "00";
}

export function truncateToSecond(ms) {
  return Math.floor(ms / 1000) * 1000;
}
