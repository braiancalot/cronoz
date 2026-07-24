import { FormattedTime } from "@/components/FormattedTime.jsx";
import { copyWithToast } from "@/lib/clipboard.js";
import { formatTimeCompact } from "@/lib/stopwatch.js";

export function LapTime({ time, label, className }) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        copyWithToast(formatTimeCompact(time), label);
      }}
      className="cursor-pointer flex items-center justify-end"
    >
      <FormattedTime time={time} className={className} />
    </div>
  );
}
