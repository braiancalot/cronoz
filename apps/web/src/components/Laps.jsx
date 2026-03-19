import { useState } from "react";
import { FormattedTime } from "@/components/FormattedTime.jsx";
import { Button } from "@/components/ui/button.jsx";

function LapItem({ lap, onRename, onDelete }) {
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

  return (
    <div className="flex justify-between items-center gap-2 min-h-8 shrink-0">
      {isRenaming ? (
        <form
          onSubmit={handleRename}
          className="flex-1 flex items-center gap-2"
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleCancel}
            className="border border-teal-500 rounded text-white py-0.5 px-2 outline-none flex-1 text-sm h-7"
            autoFocus
          />
        </form>
      ) : (
        <>
          <span>{lap.name}</span>
          <div className="flex items-center gap-3">
            <FormattedTime time={lap.lapTime} />
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleStartRename}
              title="Renomear"
            >
              ✎
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onDelete(lap.id)}
              title="Deletar"
              className="hover:text-destructive"
            >
              ✕
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export function Laps({ laps, onRenameLap, onDeleteLap }) {
  return (
    <div className="flex flex-col h-54 mb-8 overflow-auto gap-2 px-8 w-full max-w-125">
      {laps?.map((lap) => (
        <LapItem
          key={lap.id}
          lap={lap}
          onRename={onRenameLap}
          onDelete={onDeleteLap}
        />
      ))}
    </div>
  );
}
