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

export function calculateTime(project) {
  if (!project) return 0;

  const { isRunning, startTimestamp, totalTime } = project;
  if (isRunning && startTimestamp) {
    return totalTime + (Date.now() - startTimestamp);
  }

  return totalTime;
}

export function hasHours(hours) {
  return hours !== "00";
}
