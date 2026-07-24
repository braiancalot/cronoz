import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button.jsx";
import { formatCountdown } from "./syncFormat.js";

export function SyncPairingCode({
  code,
  remainingMs,
  loading,
  onCopy,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">
        Digite este código no outro dispositivo:
      </p>
      <button
        type="button"
        onClick={onCopy}
        className="font-mono text-4xl tracking-widest tabular-nums hover:opacity-80"
      >
        {code}
      </button>
      <p className="text-xs text-muted-foreground">
        Expira em {formatCountdown(remainingMs)}
      </p>
      <div className="flex flex-col gap-2 mt-2 sm:flex-row">
        <Button onClick={onConfirm} disabled={loading}>
          <CheckIcon /> Já pareei o outro device
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <XIcon /> Cancelar
        </Button>
      </div>
    </div>
  );
}
