import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog.jsx";
import { ScrollArea } from "@/components/ui/scroll-area.jsx";
import { useIgnoreMilliseconds } from "@/hooks/useIgnoreMilliseconds.js";
import { summarizeLaps } from "@/lib/lapsSummary.js";
import { timeColumnWidth } from "@/lib/stopwatch.js";
import { showUndoToast } from "@/lib/undoToast.js";
import { cn } from "@/lib/utils.js";
import { LapCard } from "./LapCard.jsx";
import { LapItem } from "./LapItem.jsx";
import { LapNameForm } from "./LapNameForm.jsx";

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

  const lapSummaries = summarizeLaps({
    laps,
    currentLapTime: 0,
    ignoreMs,
  }).reverse();
  // No grid spans the cards, so the list picks one width and every row holds it.
  const lapTimeWidth = timeColumnWidth(
    Math.max(0, ...lapSummaries.map((lap) => lap.lapTime)),
  );

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    const { id, name } = pendingDelete;
    setPendingDelete(null);
    const { undo } = await onDeleteLap(id);
    showUndoToast(`Volta "${name}" apagada`, undo);
  }

  return (
    <>
      {/* Width, height and vertical spacing are the stage's call, not ours. */}
      <div className={cn("flex flex-col min-h-0 w-full", className)}>
        <ScrollArea type="auto" className="flex-1 min-h-0">
          {/* pr-3 clears the overlay scrollbar (~10-12px), which floats flush
              against the viewport's true right edge regardless of this div's
              own padding. Without it, the scrollbar sits on top of each
              row's floating menu button. */}
          <div className="flex flex-col gap-1.5 py-2 pr-3 w-full">
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
            {lapSummaries.map((lap) => (
              <LapItem
                key={lap.id}
                lap={lap}
                lapTime={lap.lapTime}
                cumulativeTime={lap.cumulativeTime}
                lapTimeWidth={lapTimeWidth}
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
