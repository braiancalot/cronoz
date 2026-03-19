import { useState } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";

export function ProjectHeader({ name, onRename, onDelete }) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState("");

  function handleStartRename() {
    setNewName(name);
    setIsRenaming(true);
  }

  async function handleRename(event) {
    event.preventDefault();
    if (!newName) return;

    await onRename(newName);
    setIsRenaming(false);
    setNewName("");
  }

  function handleCancel() {
    setIsRenaming(false);
    setNewName("");
  }

  return (
    <header className="w-full h-16 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 justify-start">
        <Link to="/" className="text-lg">
          <ArrowLeftIcon />
        </Link>

        {isRenaming ? (
          <form onSubmit={handleRename} className="w-auto">
            <Input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              autoFocus
            />
          </form>
        ) : (
          <h1 className="text-lg font-medium">{name}</h1>
        )}
      </div>

      {isRenaming ? (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRename}>
            Salvar
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleStartRename}>
            Renomear
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            Deletar
          </Button>
        </div>
      )}
    </header>
  );
}
