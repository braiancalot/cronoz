import { useCallback } from "react";
import { LapCard } from "./LapCard.jsx";
import { LapMenu } from "./LapMenu.jsx";
import { LapName } from "./LapName.jsx";
import { LapNameForm } from "./LapNameForm.jsx";
import { LapTime } from "./LapTime.jsx";
import { useInlineRename } from "@/hooks/useInlineRename.js";
import { copyWithToast } from "@/lib/clipboard.js";
import { formatTimeCompact } from "@/lib/stopwatch.js";

export function LapItem({
  lap,
  lapTime,
  cumulativeTime,
  lapTimeWidth,
  onRename,
  onRequestDelete,
}) {
  const handleRename = useCallback(
    (name) => onRename(lap.id, name),
    [onRename, lap.id],
  );

  const { isEditing, draft, setDraft, displayName, start, cancel, submit } =
    useInlineRename(lap.name, handleRename);

  if (isEditing) {
    return (
      <LapCard>
        <LapNameForm
          value={draft}
          onChange={setDraft}
          onSubmit={submit}
          onCancel={cancel}
        />
      </LapCard>
    );
  }

  return (
    <LapCard>
      <LapName>{displayName}</LapName>
      {/* Flush right, so the lap time's width is what the accumulated one
          right-aligns against — only that cell needs locking. */}
      <div className="flex items-center gap-5 shrink-0">
        <LapTime
          time={cumulativeTime}
          label="Tempo acumulado"
          className="text-muted-foreground"
        />
        <LapTime
          time={lapTime}
          label="Tempo da volta"
          widthClassName={lapTimeWidth}
        />
      </div>
      <LapMenu
        onCopyTimes={() =>
          copyWithToast(
            `${formatTimeCompact(cumulativeTime)} (${formatTimeCompact(lapTime)})`,
            "Tempos",
            { plural: true },
          )
        }
        onRename={start}
        onDelete={() => onRequestDelete(lap)}
      />
    </LapCard>
  );
}
