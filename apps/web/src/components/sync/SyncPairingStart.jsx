import { Button } from "@/components/ui/button.jsx";

export function SyncPairingStart({ loading, onGenerate, onJoin }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Sincronize seus projetos entre seus dispositivos.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={onGenerate} disabled={loading}>
          Gerar código
        </Button>
        <Button variant="outline" onClick={onJoin}>
          Inserir código
        </Button>
      </div>
    </div>
  );
}
