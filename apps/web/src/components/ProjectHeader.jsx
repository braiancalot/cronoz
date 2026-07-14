import {
  ArrowCounterClockwiseIcon,
  ArrowLeftIcon,
  CheckIcon,
  ClockCountdownIcon,
  ClockIcon,
  DotsThreeVerticalIcon,
  EraserIcon,
  PencilSimpleIcon,
  PictureInPictureIcon,
  TrashIcon,
  XIcon,
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
import { useInlineEditForm } from "@/hooks/useInlineEditForm.js";
import { useInlineRename } from "@/hooks/useInlineRename.js";

export function ProjectHeader({
  name,
  onRename,
  onDelete,
  onDiscardCurrentTime,
  canDiscardCurrentTime,
  onAdjust,
  canAdjust,
  onReset,
  canReset,
  onOpenPiP,
  onViewExactTime,
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

  const { formProps, fieldProps, keepFocus } = useInlineEditForm({
    value: draft,
    onSubmit: submit,
    onCancel: handleCancel,
  });

  return (
    <header className="w-full h-16 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 justify-start">
        <Link to="/" className="text-lg">
          <ArrowLeftIcon className="size-5" />
        </Link>

        {isRenaming ? (
          <form {...formProps} className="w-auto">
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onFocus={(event) => event.target.select()}
              {...fieldProps}
              autoFocus
            />
          </form>
        ) : (
          <h1 className="text-lg font-medium">{displayName}</h1>
        )}
      </div>

      {isRenaming ? (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            title="Cancelar"
            aria-label="Cancelar"
            {...keepFocus}
            onClick={handleCancel}
          >
            <XIcon />
          </Button>
          <Button
            size="icon"
            title="Salvar"
            aria-label="Salvar"
            {...keepFocus}
            onClick={submit}
          >
            <CheckIcon />
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
                variant="edit"
                onSelect={onAdjust}
                disabled={!canAdjust}
              >
                <ClockIcon />
                Ajustar tempo
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="edit"
                onSelect={onDiscardCurrentTime}
                disabled={!canDiscardCurrentTime}
              >
                <EraserIcon />
                Descartar tempo atual
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="edit" onSelect={handleStartRename}>
                <PencilSimpleIcon />
                Renomear
              </DropdownMenuItem>
              {onViewExactTime && (
                <DropdownMenuItem variant="info" onSelect={onViewExactTime}>
                  <ClockCountdownIcon />
                  Tempo exato
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={onReset}
                disabled={!canReset}
              >
                <ArrowCounterClockwiseIcon />
                Resetar cronômetro
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                <TrashIcon />
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </header>
  );
}
