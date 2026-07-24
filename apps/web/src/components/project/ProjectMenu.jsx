import {
  ClockCountdownIcon,
  ClockIcon,
  DotsThreeVerticalIcon,
  EraserIcon,
  PencilSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button.jsx";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu.jsx";

export function ProjectMenu({
  onRename,
  onAdjust,
  canAdjust,
  onViewExactTime,
  onDiscardCurrentTime,
  canDiscardCurrentTime,
  onDelete,
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Mais opções">
          <DotsThreeVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem variant="edit" onSelect={onRename}>
          <PencilSimpleIcon />
          Renomear
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="edit"
          onSelect={onAdjust}
          disabled={!canAdjust}
        >
          <ClockIcon />
          Ajustar tempo
        </DropdownMenuItem>
        {/* Separator inside the guard: without it, hiding the lone item in this
            group would leave two rules stacked together. */}
        {onViewExactTime && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="info" onSelect={onViewExactTime}>
              <ClockCountdownIcon />
              Tempo exato
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={onDiscardCurrentTime}
          disabled={!canDiscardCurrentTime}
        >
          <EraserIcon />
          Descartar tempo atual
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <TrashIcon />
          Deletar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
