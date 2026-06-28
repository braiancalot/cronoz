import {
  ArrowLeftIcon,
  DotsThreeVerticalIcon,
  PictureInPictureIcon,
} from "@phosphor-icons/react";
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
import { useInlineRename } from "@/hooks/useInlineRename.js";

export function ProjectHeader({
  name,
  onRename,
  onDelete,
  onDiscardCurrentTime,
  canDiscardCurrentTime,
  onReset,
  canReset,
  onOpenPiP,
}) {
  const {
    isEditing: isRenaming,
    draft,
    setDraft,
    displayName,
    start: handleStartRename,
    cancel: handleCancel,
    submit,
  } = useInlineRename(name, onRename);

  function handleRename(event) {
    event.preventDefault();
    submit();
  }

  return (
    <header className="w-full h-16 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 justify-start">
        <Link to="/" className="text-lg">
          <ArrowLeftIcon className="size-5" />
        </Link>

        {isRenaming ? (
          <form onSubmit={handleRename} className="w-auto">
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onFocus={(event) => event.target.select()}
              autoFocus
            />
          </form>
        ) : (
          <h1 className="text-lg font-medium">{displayName}</h1>
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
        <div className="flex items-center gap-1">
          {onOpenPiP && (
            <Button
              variant="ghost"
              size="icon"
              title="Abrir em janela flutuante"
              onClick={onOpenPiP}
            >
              <PictureInPictureIcon />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title="Mais opções">
                <DotsThreeVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={onDiscardCurrentTime}
                disabled={!canDiscardCurrentTime}
              >
                Descartar tempo atual
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onReset} disabled={!canReset}>
                Resetar cronômetro
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
        </div>
      )}
    </header>
  );
}
