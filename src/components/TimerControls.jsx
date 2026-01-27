"use client";

export function TimerControls({
  isRunning,
  hasTime,
  onStart,
  onPause,
  onReset,
}) {
  return (
    <div className="flex w-full pb-8 gap-4 items-center justify-center">
      {!isRunning && (
        <button
          className="px-5 py-3 border border-neutral-600 hover:bg-neutral-900 active:bg-neutral-700 text-white rounded-lg active:scale-95 text-sm transition-all disabled:opacity-30 disabled:active:scale-100"
          onClick={onReset}
          disabled={!hasTime}
        >
          Reset
        </button>
      )}

      {isRunning ? (
        <button
          className="px-5 py-3 border border-transparent bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white rounded-lg active:scale-95 text-sm font-medium transition-all"
          onClick={onPause}
        >
          Pause
        </button>
      ) : (
        <button
          className="px-5 py-3 border border-transparent bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg active:scale-95 text-sm font-medium transition-all"
          onClick={onStart}
        >
          Start
        </button>
      )}
    </div>
  );
}
