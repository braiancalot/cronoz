import {
  ArrowsClockwiseIcon,
  LinkBreakIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button.jsx";
import { formatRelativeTime } from "./syncFormat.js";
import { syncErrorMessage } from "./syncMessages.js";

export function SyncPairedPanel({
  lastSyncedAt,
  deviceCount,
  error,
  onSyncNow,
  onAddDevice,
  onUnpair,
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 text-sm">
        <p>
          Última sincronização:{" "}
          <span className="font-medium">
            {formatRelativeTime(lastSyncedAt)}
          </span>
        </p>
        <p className="text-muted-foreground">
          {deviceCount === null
            ? "Carregando dispositivos..."
            : `${deviceCount} dispositivo${deviceCount === 1 ? "" : "s"} no grupo`}
        </p>
        {error && (
          <p className="text-destructive">
            Falha na última sincronização: {syncErrorMessage(error)}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button onClick={onSyncNow}>
          <ArrowsClockwiseIcon /> Sincronizar agora
        </Button>
        <Button variant="outline" onClick={onAddDevice}>
          <PlusIcon /> Adicionar dispositivo
        </Button>
        <Button variant="destructive" onClick={onUnpair}>
          <LinkBreakIcon /> Desparear
        </Button>
      </div>
    </div>
  );
}
