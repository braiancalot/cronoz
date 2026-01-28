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
      {!isRunning && hasTime && (
        <button
          className="px-5 py-3 border border-neutral-600 text-white rounded-lg text-sm transition-all hover:bg-neutral-900 active:scale-95 active:bg-neutral-700"
          onClick={onReset}
          disabled={!hasTime}
        >
          Reset
        </button>
      )}

      <button
        className={`px-5 py-3 border border-transparent text-white rounded-lg active:scale-95 text-sm font-medium transition-all ${
          isRunning
            ? "bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800"
            : "bg-green-600 hover:bg-green-700 active:bg-green-800"
        }`}
        onClick={isRunning ? onPause : onStart}
      >
        {isRunning ? "Pause" : "Start"}
      </button>
    </div>
  );
}
