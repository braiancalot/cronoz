import { Button } from "@/components/ui/button.jsx";
import { pairingErrorMessage } from "./syncMessages.js";

export function SyncPairingStart({
  busy,
  isOnline,
  wasRevoked,
  error,
  onGenerate,
  onJoin,
}) {
  return (
    <div className="flex flex-col gap-3">
      {wasRevoked && (
        <p className="text-sm">
          Este dispositivo foi despareado. Pareie de novo para voltar a
          sincronizar.
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Mantenha os mesmos projetos em todos os seus dispositivos. Gere um
        código em um deles e digite no outro.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={onGenerate} disabled={busy || !isOnline}>
          {busy ? "Gerando…" : "Gerar código"}
        </Button>
        <Button variant="outline" onClick={onJoin} disabled={!isOnline}>
          Tenho um código
        </Button>
      </div>
      {!isOnline && (
        <p className="text-sm text-muted-foreground">
          Sem conexão. O pareamento precisa de internet.
        </p>
      )}
      {isOnline && error && (
        <p role="alert" className="text-sm text-destructive">
          {pairingErrorMessage(error)}
        </p>
      )}
    </div>
  );
}
