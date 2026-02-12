"use client";

import { formatTime, hasHours } from "@/lib/stopwatch.js";

export function Laps({ laps }) {
  return (
    <div className="flex flex-col h-54 mb-8 overflow-auto gap-2 px-8 w-full max-w-[500]">
      {laps?.map((lap) => {
        const { hours, minutes, seconds } = formatTime(lap.time);

        return (
          <div key={lap.id} className="flex justify-between items-center">
            <span>{lap.name}</span>

            <div className="flex font-medium items-center justify-center cursor-pointer">
              {hasHours(hours) && (
                <>
                  <span>{hours}</span>
                  <span className="opacity-50">:</span>
                </>
              )}
              <span>{minutes}</span>
              <span className="opacity-50">:</span>
              <span>{seconds}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
