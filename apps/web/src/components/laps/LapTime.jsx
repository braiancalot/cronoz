import { FormattedTime } from "@/components/FormattedTime.jsx";
import { copyWithToast } from "@/lib/clipboard.js";
import { formatTimeCompact } from "@/lib/stopwatch.js";

export function LapTime({ time, label, className, width }) {
  return (
    <div
      onClick={(event) => {
        event.stopPropagation();
        copyWithToast(formatTimeCompact(time), label);
      }}
      // tabular-nums here too: width is in ch, resolved on this element.
      className="cursor-pointer flex items-center justify-end tabular-nums"
      style={{ width }}
    >
      <FormattedTime time={time} className={className} />
    </div>
  );
}
