"use client";

import { formatTime } from "@/lib/stopwatch";

function hasHours(hours) {
  return hours !== "00";
}

export function TimerDisplay({ time }) {
  const { hours, minutes, seconds, milliseconds } = formatTime(time);

  async function handleCopyToClipboard() {
    let formatted = "";

    if (hasHours(hours)) formatted += `${hours}h`;
    formatted += `${minutes}m${seconds}s`;

    await navigator.clipboard.writeText(formatted);
    alert("Tempo copiado.");
  }

  return (
    <div
      className="flex text-6xl md:text-8xl font-medium items-center justify-center cursor-pointer"
      onClick={handleCopyToClipboard}
    >
      {hasHours(hours) && (
        <>
          <span>{hours}</span>
          <span className="opacity-50">:</span>
        </>
      )}
      <span>{minutes}</span>
      <span className="opacity-50">:</span>
      <span>{seconds}</span>
      <span className="opacity-30">.</span>
      <span className="text-4xl md:text-6xl opacity-60 w-12">
        {milliseconds}
      </span>
    </div>
  );
}
