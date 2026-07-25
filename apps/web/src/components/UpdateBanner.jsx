import { XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button.jsx";

export function UpdateBanner({ onUpdate, onDismiss }) {
  return (
    <div className="shrink-0 bg-card text-card-foreground flex items-center justify-between gap-3 px-4 md:px-8 py-2">
      <span className="min-w-0 truncate text-sm">Nova versão disponível</span>

      <div className="flex shrink-0 items-center gap-1">
        <Button size="sm" onClick={onUpdate}>
          Atualizar
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDismiss}
          aria-label="Dispensar"
        >
          <XIcon />
        </Button>
      </div>
    </div>
  );
}
