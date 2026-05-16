import { useState } from "react";
import { MoreVerticalIcon } from "lucide-react";
import { FormattedTime } from "@/components/FormattedTime.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu.jsx";
import { ScrollArea } from "@/components/ui/scroll-area.jsx";
import { Card } from "@/components/ui/card.jsx";
import { ConfirmDialog } from "@/components/ConfirmDialog.jsx";
import { useIgnoreMilliseconds } from "@/hooks/useIgnoreMilliseconds.js";
import { formatTimeCompact, truncateToSecond } from "@/lib/stopwatch.js";
import { toast } from "sonner";

function LapItem({ lap, lapTime, cumulativeTime, onRename, onRequestDelete }) {
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

  if (isRenaming) {
    return (
      <form
        onSubmit={handleRename}
        className="col-span-full flex items-center min-h-9"
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
    );
  }

  return (
    <>
      <span className="min-h-9 flex items-center truncate">{lap.name}</span>
      <div
        onClick={() =>
          copyToClipboard(formatTimeCompact(cumulativeTime), "Tempo acumulado")
        }
        className="cursor-pointer flex items-center min-h-9 justify-end"
      >
        <FormattedTime
          time={cumulativeTime}
          className="text-muted-foreground"
        />
      </div>
      <div
        onClick={() =>
          copyToClipboard(formatTimeCompact(lapTime), "Tempo da volta")
        }
        className="cursor-pointer flex items-center min-h-9 justify-end"
      >
        <FormattedTime time={lapTime} />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" title="Mais opções">
            <MoreVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() =>
              copyToClipboard(
                `${formatTimeCompact(cumulativeTime)} (${formatTimeCompact(lapTime)})`,
                "Tempos",
              )
            }
          >
            Copiar tempos
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleStartRename}>
            Renomear
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => onRequestDelete(lap)}
          >
            Apagar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
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
}) {
  const ignoreMs = useIgnoreMilliseconds();
  const activeLaps = laps?.filter((lap) => !lap.deletedAt);
  const [pendingDelete, setPendingDelete] = useState(null);

  const cumulativeByLapId = new Map();
  let acc = 0;
  for (let i = (activeLaps?.length ?? 0) - 1; i >= 0; i--) {
    const lap = activeLaps[i];
    acc += ignoreMs ? truncateToSecond(lap.lapTime) : lap.lapTime;
    cumulativeByLapId.set(lap.id, acc);
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setPendingDelete(null);
    await onDeleteLap(id);
  }

  return (
    <>
      <Card size="xs" className="mb-8 w-full max-w-125 py-0">
        <ScrollArea className="h-54">
          <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 gap-y-1 px-4 py-2">
            {isAddingLap && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!addLapName) return;
                  onConfirmAddLap();
                }}
                className="col-span-full flex items-center min-h-9"
              >
                <Input
                  value={addLapName}
                  onChange={(e) => onAddLapNameChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && onCancelAddLap()}
                  onBlur={onCancelAddLap}
                  className="flex-1 h-7 text-sm"
                  autoFocus
                />
              </form>
            )}
            {activeLaps?.map((lap) => (
              <LapItem
                key={lap.id}
                lap={lap}
                lapTime={ignoreMs ? truncateToSecond(lap.lapTime) : lap.lapTime}
                cumulativeTime={cumulativeByLapId.get(lap.id)}
                onRename={onRenameLap}
                onRequestDelete={setPendingDelete}
              />
            ))}
          </div>
        </ScrollArea>
      </Card>

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
    </>
  );
}
