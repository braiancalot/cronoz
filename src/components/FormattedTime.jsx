"use client";

import { formatTime, hasHours } from "@/lib/stopwatch.js";

export function FormattedTime({
  time,
  showMilliseconds = false,
  className = "",
  millisecondsClassName = "",
}) {
  const { hours, minutes, seconds, milliseconds } = formatTime(time);

  return (
    <div className={`flex font-medium items-center justify-center tabular-nums ${className}`}>
      {hasHours(hours) && (
        <>
          <span>{hours}</span>
          <span className="opacity-50">:</span>
        </>
      )}
      <span>{minutes}</span>
      <span className="opacity-50">:</span>
      <span>{seconds}</span>
      {showMilliseconds && (
        <>
          <span className="opacity-30">.</span>
          <span className={millisecondsClassName}>{milliseconds}</span>
        </>
      )}
    </div>
  );
}
