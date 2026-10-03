import { Button } from "@/components/ui/button.jsx";
import { pairingErrorMessage } from "./syncMessages.js";

const ENDED_MESSAGES = {
  expired: "O código expirou.",
  burned: "Código invalidado. Gere outro.",
};

export function SyncPairingEnded({
  hostState,
  busy,
  isOnline,
  error,
  onRegenerate,
  onCancel,
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">{ENDED_MESSAGES[hostState]}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={onRegenerate} disabled={busy || !isOnline}>
          {busy ? "Gerando…" : "Gerar outro código"}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {pairingErrorMessage(error)}
        </p>
      )}
    </div>
  );
}
