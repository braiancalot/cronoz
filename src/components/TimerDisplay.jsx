"use client";

import { formatTime } from "@/lib/stopwatch";

const HOURLY_PRICE = 10;
const MS_PER_HOUR = 60 * 60 * 1000;

function hasHours(hours) {
  return hours !== "00";
}

function calculateTotalPrice(totalTime) {
  return (totalTime / MS_PER_HOUR) * HOURLY_PRICE;
}

export function TimerDisplay({ time, isRunning = false }) {
  const { hours, minutes, seconds, milliseconds } = formatTime(time);
  const price = calculateTotalPrice(time);

  async function handleCopyToClipboard() {
    let formatted = "";

    if (hasHours(hours)) formatted += `${hours}h`;
    formatted += `${minutes}m${seconds}s`;

    await navigator.clipboard.writeText(formatted);
    alert("Tempo copiado.");
  }

  return (
    <div className="flex flex-col items-center gap-2">
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

      <span
        className={`font-medium text-md md:text-lg text-teal-700 ${isRunning && "invisible "}`}
      >
        (
        {new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(price)}
        )
      </span>
    </div>
  );
}
