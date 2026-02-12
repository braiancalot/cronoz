"use client";

export function Laps({ laps }) {
  return (
    <div className="flex flex-col h-54 mb-8 overflow-auto gap-2 px-8 w-full max-w-[500]">
      {laps?.map((lap) => (
        <div key={lap.id} className="flex justify-between items-center">
          <span>{lap.name}</span>
          <span>{lap.time}</span>
        </div>
      ))}
    </div>
  );
}
