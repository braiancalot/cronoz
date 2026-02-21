"use client";

import { formatTime, hasHours } from "@/lib/stopwatch";
import { FormattedTime } from "@/components/FormattedTime.jsx";

const MS_PER_HOUR = 60 * 60 * 1000;

function calculateTotalPrice(totalTime, hourlyPrice) {
  return (totalTime / MS_PER_HOUR) * hourlyPrice;
}

export function TimerDisplay({ time, totalTime = null, isRunning = false, hourlyPrice = 10 }) {
  const priceBase = totalTime !== null ? totalTime : time;
  const price = calculateTotalPrice(priceBase, hourlyPrice);

  async function handleCopyToClipboard() {
    const { hours: h, minutes: m } = formatTime(
      totalTime !== null ? totalTime : time,
    );
    let formatted = "";

    if (hasHours(h)) formatted += `${h}h`;
    formatted += `${m}m`;

    await navigator.clipboard.writeText(formatted);
    alert("Tempo copiado.");
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div onClick={handleCopyToClipboard} className="cursor-pointer">
        <FormattedTime
          time={time}
          showMilliseconds
          className="text-6xl md:text-8xl"
          millisecondsClassName="text-4xl md:text-6xl opacity-60"
        />
      </div>

      <div className="flex gap-2 items-center">
        {totalTime !== null && !isRunning && (
          <>
            <FormattedTime
              time={totalTime}
              className="text-lg text-neutral-400"
            />

            <span className="text-lg text-neutral-400">•</span>
          </>
        )}

        <span
          className={`font-medium text-md md:text-lg text-teal-700 ${isRunning && "invisible"}`}
        >
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(price)}
        </span>
      </div>
    </div>
  );
}
