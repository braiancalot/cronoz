import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog.jsx";
import { ScrollArea } from "@/components/ui/scroll-area.jsx";
import { useIgnoreMilliseconds } from "@/hooks/useIgnoreMilliseconds.js";
import { truncateToSecond } from "@/lib/stopwatch.js";
import { showUndoToast } from "@/lib/undoToast.js";
import { cn } from "@/lib/utils.js";
import { LapCard } from "./LapCard.jsx";
import { LapItem } from "./LapItem.jsx";
import { LapNameForm } from "./LapNameForm.jsx";

// The 8px matches the list's py-2, so unscrolled the fade lands on empty
// padding and a short list never looks like it's dissolving.
const SCROLL_FADE = "mask-y-from-[calc(100%-8px)] mask-y-to-black/35";

function totalsByLapId(laps, ignoreMs) {
  const totals = new Map();
  let acc = 0;
  for (let i = laps.length - 1; i >= 0; i--) {
    acc += ignoreMs ? truncateToSecond(laps[i].lapTime) : laps[i].lapTime;
    totals.set(laps[i].id, acc);
  }
  return totals;
}

export function Laps({
  laps,
  onRenameLap,
  onDeleteLap,
  isAddingLap = false,
  addLapName = "",
  onAddLapNameChange,
  onConfirmAddLap,
  onCancelAddLap,
  className,
}) {
  const ignoreMs = useIgnoreMilliseconds();
  const [pendingDelete, setPendingDelete] = useState(null);

  const activeLaps = laps?.filter((lap) => !lap.deletedAt) ?? [];
  const cumulative = totalsByLapId(activeLaps, ignoreMs);

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    const { id, name } = pendingDelete;
    setPendingDelete(null);
    const { undo } = await onDeleteLap(id);
    showUndoToast(`Volta "${name}" excluída`, undo);
  }

  return (
    <>
      {/* Width, height and vertical spacing are the stage's call, not ours. */}
      <div className={cn("flex flex-col min-h-0 w-full", className)}>
        <ScrollArea
          type="auto"
          className="flex-1 min-h-0"
          viewportClassName={SCROLL_FADE}
        >
          <div className="flex flex-col gap-1 py-2 w-full">
            {isAddingLap && (
              <LapCard>
                <LapNameForm
                  value={addLapName}
                  onChange={onAddLapNameChange}
                  onSubmit={onConfirmAddLap}
                  onCancel={onCancelAddLap}
                />
              </LapCard>
            )}
            {activeLaps.map((lap) => (
              <LapItem
                key={lap.id}
                lap={lap}
                lapTime={ignoreMs ? truncateToSecond(lap.lapTime) : lap.lapTime}
                cumulativeTime={cumulative.get(lap.id)}
                onRename={onRenameLap}
                onRequestDelete={setPendingDelete}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Apagar volta?"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" será removida e seu tempo deixará de contar no total.`
            : ""
        }
        confirmLabel="Apagar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
