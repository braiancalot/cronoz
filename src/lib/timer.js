const STORAGE_KEY = "cronoz-stopwatch-state";

export const DEFAULT_TIMER_STATE = {
  startTimestamp: null,
  accumulatedTime: 0,
  isRunning: false,
};

export function calculateDisplayTime(timerState) {
  const { isRunning, startTimestamp, accumulatedTime } = timerState;

  if (isRunning && startTimestamp) {
    return accumulatedTime + (Date.now() - startTimestamp);
  }

  return accumulatedTime;
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

export function startTimer(state) {
  if (state.isRunning) return state;

  return {
    ...state,
    startTimestamp: Date.now(),
    isRunning: true,
  };
}

export function pauseTimer(state) {
  if (!state.isRunning || !state.startTimestamp) return state;

  const elapsed = Date.now() - state.startTimestamp;

  return {
    startTimestamp: null,
    accumulatedTime: state.accumulatedTime + elapsed,
    isRunning: false,
  };
}

export function resetTimer() {
  return { ...DEFAULT_TIMER_STATE };
}

export function loadTimerState() {
  if (typeof window === "undefined") return DEFAULT_TIMER_STATE;

  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : DEFAULT_TIMER_STATE;
}

export function saveTimerState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
