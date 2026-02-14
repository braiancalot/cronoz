"use client";

import { formatTime, hasHours } from "@/lib/stopwatch";
import { FormattedTime } from "@/components/FormattedTime.jsx";

const HOURLY_PRICE = 10;
const MS_PER_HOUR = 60 * 60 * 1000;

function calculateTotalPrice(totalTime) {
  return (totalTime / MS_PER_HOUR) * HOURLY_PRICE;
}

export function TimerDisplay({ time, isRunning = false }) {
  const { hours, minutes } = formatTime(time);
  const price = calculateTotalPrice(time);

  async function handleCopyToClipboard() {
    let formatted = "";

    if (hasHours(hours)) formatted += `${hours}h`;
    formatted += `${minutes}m`;

    await navigator.clipboard.writeText(formatted);
    alert("Tempo copiado.");
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div onClick={handleCopyToClipboard} className="cursor-pointer">
        <FormattedTime
          time={time}
          showMilliseconds
          className="text-6xl md:text-8xl"
          millisecondsClassName="text-4xl md:text-6xl opacity-60 w-12"
        />
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
