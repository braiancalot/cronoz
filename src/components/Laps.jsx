"use client";

import { useState } from "react";
import { FormattedTime } from "@/components/FormattedTime.jsx";

function LapItem({ lap, onRename, onDelete }) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState("");

  function handleStartRename() {
    setNewName(lap.name);
    setIsRenaming(true);
  }

  function handleRename(event) {
    event.preventDefault();
    if (!newName) return;

    onRename(lap.id, newName);
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

            <FormattedTime time={lap.totalTime} />
            <button
              onClick={handleStartRename}
              className="text-sm text-neutral-500 hover:text-neutral-300 cursor-pointer transition-colors"
              title="Renomear"
            >
              ✎
            </button>
            <button
              onClick={() => onDelete(lap.id)}
              className="text-neutral-500 hover:text-red-400 cursor-pointer transition-colors"
              title="Deletar"
            >
              ✕
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function Laps({ laps, onRenameLap, onDeleteLap }) {
  return (
    <div className="flex flex-col h-54 mb-8 overflow-auto gap-2 px-8 w-full max-w-[500]">
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
