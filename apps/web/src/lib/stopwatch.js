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

export function calculateTotalTime(stopwatch) {
  if (!stopwatch) return 0;

  const { isRunning, startTimestamp, totalTime } = stopwatch;

  if (isRunning && startTimestamp) {
    return totalTime + (Date.now() - startTimestamp);
  }

  return totalTime;
}

export function calculateSplitTime(stopwatch) {
  if (!stopwatch) return 0;

  const total = calculateTotalTime(stopwatch);
  const lastLapTime = stopwatch.laps[0]?.totalTime ?? 0;
  return total - lastLapTime;
}

export function hasHours(hours) {
  return hours !== "00";
}
