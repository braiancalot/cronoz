import {
  CopyIcon,
  DotsThreeVerticalIcon,
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
import { useScrollSafeDropdown } from "@/hooks/useScrollSafeDropdown.js";

export function LapMenu({ onCopyTimes, onRename, onDelete }) {
  const { menuProps, triggerProps } = useScrollSafeDropdown();

  return (
    <DropdownMenu {...menuProps}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Mais opções"
          onClick={(e) => e.stopPropagation()}
          {...triggerProps}
        >
          <DotsThreeVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem variant="info" onSelect={onCopyTimes}>
          <CopyIcon />
          Copiar tempos
        </DropdownMenuItem>
        <DropdownMenuItem variant="edit" onSelect={onRename}>
          <PencilSimpleIcon />
          Renomear
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <TrashIcon />
          Apagar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
