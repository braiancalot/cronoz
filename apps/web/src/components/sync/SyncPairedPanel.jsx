import { ArrowsClockwiseIcon, PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button.jsx";
import { cn } from "@/lib/utils.js";
import { pairingErrorMessage } from "./syncMessages.js";
import { syncStatusLine } from "./syncStatusLine.js";

function deviceCountLabel(deviceCount) {
  if (deviceCount === null) return null;
  return deviceCount === 1
    ? "1 dispositivo pareado"
    : `${deviceCount} dispositivos pareados`;
}

export function SyncPairedPanel({
  status,
  deviceCount,
  busy,
  pairingError,
  onSyncNow,
  onAddDevice,
  onUnpair,
}) {
  const line = syncStatusLine(status);
  const cannotReachServer = status.syncing || !status.isOnline;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 text-sm">
        <p role="status" className={cn(line.isError && "text-destructive")}>
          {line.text}
        </p>
        {/* min-h holds the line while the count loads, so the buttons don't jump. */}
        <p className="min-h-5 text-muted-foreground">
          {deviceCountLabel(deviceCount)}
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={onSyncNow} disabled={cannotReachServer}>
          <ArrowsClockwiseIcon /> Sincronizar agora
        </Button>
        <Button
          variant="outline"
          onClick={onAddDevice}
          disabled={busy || !status.isOnline}
        >
          <PlusIcon /> Adicionar dispositivo
        </Button>
      </div>
      {pairingError && (
        <p role="alert" className="text-sm text-destructive">
          {pairingErrorMessage(pairingError)}
        </p>
      )}
      <Button
        variant="link"
        onClick={onUnpair}
        className="mt-2 h-auto self-start p-0 text-muted-foreground"
      >
        Desparear este dispositivo
      </Button>
    </div>
  );
}
