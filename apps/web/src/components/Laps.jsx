import { useState } from "react";
import { PencilIcon, XIcon } from "lucide-react";
import { FormattedTime } from "@/components/FormattedTime.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { ConfirmDialog } from "@/components/ConfirmDialog.jsx";
import { useIgnoreMilliseconds } from "@/hooks/useIgnoreMilliseconds.js";
import { formatTimeCompact, truncateToSecond } from "@/lib/stopwatch.js";
import { toast } from "sonner";

function LapItem({ lap, lapTime, onRename, onRequestDelete }) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState("");

  function handleStartRename() {
    setNewName(lap.name);
    setIsRenaming(true);
  }

  async function handleRename(event) {
    event.preventDefault();
    if (!newName) return;

    await onRename(lap.id, newName);
    setIsRenaming(false);
    setNewName("");
  }

  function handleCancel() {
    setIsRenaming(false);
    setNewName("");
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") handleCancel();
  }

  async function copyToClipboard(text, label) {
    await navigator.clipboard.writeText(text);
    toast(`${label} copiado`, { position: "top-center" });
  }

  return (
    <div className="flex justify-between items-center gap-2 min-h-8 shrink-0">
      {isRenaming ? (
        <form
          onSubmit={handleRename}
          className="flex-1 flex items-center gap-2"
        >
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleCancel}
            className="flex-1 h-7 text-sm"
            autoFocus
          />
        </form>
      ) : (
        <>
          <span>{lap.name}</span>
          <div className="flex items-center gap-3">
            <div
              onClick={() =>
                copyToClipboard(formatTimeCompact(lapTime), "Tempo da volta")
              }
              className="cursor-pointer"
            >
              <FormattedTime time={lapTime} />
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleStartRename}
              title="Renomear"
            >
              <PencilIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onRequestDelete(lap)}
              title="Deletar"
              className="hover:text-destructive"
            >
              <XIcon />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export function Laps({ laps, onRenameLap, onDeleteLap }) {
  const ignoreMs = useIgnoreMilliseconds();
  const activeLaps = laps?.filter((lap) => !lap.deletedAt);
  const [pendingDelete, setPendingDelete] = useState(null);

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setPendingDelete(null);
    await onDeleteLap(id);
  }

  return (
    <div className="flex flex-col h-54 mb-8 overflow-auto gap-2 px-8 w-full max-w-125">
      {activeLaps?.map((lap) => (
        <LapItem
          key={lap.id}
          lap={lap}
          lapTime={ignoreMs ? truncateToSecond(lap.lapTime) : lap.lapTime}
          onRename={onRenameLap}
          onRequestDelete={setPendingDelete}
        />
      ))}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Apagar volta?"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" será removida e seu tempo será perdido. Essa ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Apagar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
