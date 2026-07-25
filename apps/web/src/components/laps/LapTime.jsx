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
      // tabular-nums here too, not just on FormattedTime: widthClassName is in
      // ch units, and ch resolves against this element's own digit advance.
      className={cn(
        "cursor-pointer flex items-center justify-end tabular-nums",
        widthClassName,
      )}
    >
      <FormattedTime time={time} className={className} />
    </div>
  );
}
