import { useState } from "react";
import { roundDownToMinute, roundUpToMinute } from "@/lib/stopwatch.js";

// Holds the in-progress segment value while the adjust UI is open. Edits stay
// local (live preview) and are only committed on "Pronto"; "Cancelar" just
// drops the draft. Always clamped at 0 so the time can't go negative.
export function useAdjustDraft() {
  const [value, setValue] = useState(0);

  return {
    value,
    begin: (initial) => setValue(Math.max(0, initial)),
    step: (delta) => setValue((current) => Math.max(0, current + delta)),
    snap: (direction) =>
      setValue((current) =>
        direction === "up"
          ? roundUpToMinute(current)
          : roundDownToMinute(current),
      ),
  };
}
