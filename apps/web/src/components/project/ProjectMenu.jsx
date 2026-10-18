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
import { REAL_TIME_STATUS } from "@/lib/realTime.js";

const REAL_TIME_UNAVAILABLE = {
  [REAL_TIME_STATUS.untracked]: "Indisponível em projetos antigos",
  [REAL_TIME_STATUS.inconsistent]: "Alterado por uma versão antiga do app",
};

export function ProjectMenu({
  onRename,
  onAdjust,
  canAdjust,
  onViewRealTime,
  realTimeStatus,
  onDiscardCurrentTime,
  canDiscardCurrentTime,
  onDelete,
}) {
  const realTimeUnavailable = REAL_TIME_UNAVAILABLE[realTimeStatus];

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
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="info"
          onSelect={onViewRealTime}
          disabled={Boolean(realTimeUnavailable)}
        >
          <ClockCountdownIcon />
          <span className="flex flex-col">
            Tempo real
            {realTimeUnavailable && (
              <span className="text-xs text-muted-foreground">
                {realTimeUnavailable}
              </span>
            )}
          </span>
        </DropdownMenuItem>
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
          Apagar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
