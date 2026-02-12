"use client";

export function TimerControls({
  isRunning,
  hasTime,
  onStart,
  onPause,
  onReset,
  onAddLap,
}) {
  return (
    <div className="flex w-full pb-8 gap-4 items-center justify-center">
      {!isRunning && hasTime && (
        <button
          className="px-5 py-2 min-w-24 border border-neutral-600 outline-hidden text-white rounded-lg text-sm transition-all hover:bg-neutral-900 active:scale-95 active:bg-neutral-700 cursor-pointer"
          onClick={onReset}
        >
          Reset
        </button>
      )}

      {isRunning && hasTime && (
        <button
          className="px-5 py-2 min-w-24 border border-teal-600 outline-hidden text-white rounded-lg text-sm transition-all hover:bg-neutral-900 active:scale-95 active:bg-teal-700 cursor-pointer"
          onClick={onAddLap}
        >
          Lap
        </button>
      )}

      <button
        className="px-5 py-2 border min-w-24 border-transparent outline-hidden text-white rounded-lg active:scale-95 text-sm font-medium transition-all cursor-pointer bg-teal-600 hover:bg-teal-700 active:bg-teal-800"
        onClick={isRunning ? onPause : onStart}
      >
        {isRunning ? "Pause" : "Start"}
      </button>
    </div>
  );
}
