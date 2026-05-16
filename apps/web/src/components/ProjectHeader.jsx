import { useState } from "react";
import { ArrowLeftIcon, MoreVerticalIcon } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu.jsx";

export function ProjectHeader({
  name,
  onRename,
  onDelete,
  onDiscardCurrentTime,
  canDiscardCurrentTime,
}) {
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
              onFocus={(event) => event.target.select()}
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
          <Button size="sm" onClick={handleRename}>
            Salvar
          </Button>
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="Mais opções">
              <MoreVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={onDiscardCurrentTime}
              disabled={!canDiscardCurrentTime}
            >
              Descartar tempo atual
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleStartRename}>
              Renomear
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              Deletar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
