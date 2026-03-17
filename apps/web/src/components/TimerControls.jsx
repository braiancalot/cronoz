export function TimerControls({
  isRunning,
  hasLapTime,
  onStart,
  onPause,
  onAddLap,
}) {
  return (
    <div className="flex w-full pb-8 gap-4 items-center justify-center">
      <button
        className={`px-5 py-2 min-w-24 border border-teal-600 outline-hidden text-white rounded-lg text-sm transition-all ${hasLapTime ? "hover:bg-neutral-900 active:scale-95 active:bg-teal-700 cursor-pointer" : "opacity-40 cursor-not-allowed"}`}
        onClick={hasLapTime ? onAddLap : undefined}
        disabled={!hasLapTime}
      >
        Lap
      </button>

      <button
        className="px-5 py-2 border min-w-24 border-transparent outline-hidden text-white rounded-lg active:scale-95 text-sm font-medium transition-all cursor-pointer bg-teal-600 hover:bg-teal-700 active:bg-teal-800"
        onClick={isRunning ? onPause : onStart}
      >
        {isRunning ? "Pause" : "Start"}
      </button>
    </div>
  );
}
