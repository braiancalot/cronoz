import { cn } from "@/lib/utils.js";

export function RunningIndicator({ offsetClass, sizeClass }) {
  return (
    <span
      aria-label="Cronômetro em andamento"
      className={cn(
        "absolute top-1/2 -translate-y-1/2 flex",
        offsetClass,
        sizeClass,
      )}
    >
      <span className="absolute inset-0 rounded-full bg-primary opacity-75 animate-ping" />
      <span className={cn("relative rounded-full bg-primary", sizeClass)} />
    </span>
  );
}
