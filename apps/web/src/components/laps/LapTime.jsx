import { FormattedTime } from "@/components/FormattedTime.jsx";
import { copyWithToast } from "@/lib/clipboard.js";
import { formatTimeCompact } from "@/lib/stopwatch.js";
import { cn } from "@/lib/utils.js";

export function LapTime({ time, label, className, widthClassName }) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        copyWithToast(formatTimeCompact(time), label);
      }}
      // tabular-nums here too: widthClassName is in ch, resolved on this element.
      className={cn(
        "cursor-pointer flex items-center justify-end tabular-nums",
        widthClassName,
      )}
    >
      <FormattedTime time={time} className={className} />
    </div>
  );
}
