import { Button } from "@/components/ui/button.jsx";
import { useCountdown } from "@/hooks/useCountdown.js";
import { formatPairingCode } from "@/lib/pairingCode.js";
import { formatCountdown } from "./syncFormat.js";

export function SyncPairingCode({ code, expiresAt, onCopy, onCancel }) {
  const remainingMs = useCountdown(expiresAt);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">
        Digite este código no outro dispositivo
      </p>
      <button
        type="button"
        onClick={onCopy}
        className="flex flex-col items-center gap-1 hover:opacity-80"
      >
        <span className="font-mono text-4xl tracking-widest tabular-nums">
          {formatPairingCode(code)}
        </span>
        <span className="text-xs text-muted-foreground">Toque para copiar</span>
      </button>
      <p className="text-sm text-muted-foreground tabular-nums">
        Aguardando o outro dispositivo… expira em {formatCountdown(remainingMs)}
      </p>
      <Button variant="outline" onClick={onCancel} className="mt-2">
        Cancelar
      </Button>
    </div>
  );
}
