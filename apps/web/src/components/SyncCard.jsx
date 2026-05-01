import { useEffect, useState } from "react";
import {
  CheckIcon,
  PlusIcon,
  RefreshCwIcon,
  UnlinkIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import syncManager from "@/services/syncManager.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.jsx";
import { usePairing } from "@/hooks/usePairing.js";
import { useSyncStatus } from "@/hooks/useSyncStatus.js";

function formatRelativeTime(ts) {
  if (!ts) return "nunca";
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 5) return "agora mesmo";
  if (seconds < 60) return `há ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const ERROR_MESSAGES = {
  invalid_or_expired_code: "Código inválido ou expirado.",
  device_already_paired: "Este dispositivo já está pareado em outro grupo.",
};

const SYNC_ERROR_MESSAGES = {
  network_error: "Sem conexão com o servidor.",
  http_500: "Servidor indisponível. Tente novamente.",
  http_502: "Servidor indisponível. Tente novamente.",
  http_503: "Servidor indisponível. Tente novamente.",
  unknown_error: "Falha ao sincronizar.",
};

function syncErrorMessage(code) {
  return SYNC_ERROR_MESSAGES[code] ?? "Falha ao sincronizar.";
}

export function SyncCard() {
  const pairing = usePairing();
  const status = useSyncStatus();
  const [joining, setJoining] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [confirmUnpair, setConfirmUnpair] = useState(false);
  const [deviceCount, setDeviceCount] = useState(null);

  useEffect(() => {
    if (!status.isPaired) {
      setDeviceCount(null);
      return;
    }
    let cancelled = false;
    syncManager.getDeviceCount().then((c) => {
      if (!cancelled) setDeviceCount(c);
    });
    return () => {
      cancelled = true;
    };
  }, [status.isPaired]);

  async function handleGenerate() {
    await pairing.generateCode();
  }

  async function handleConfirmPaired() {
    const result = await pairing.confirmPaired();
    if (result.ok) {
      toast.success("Pareado com sucesso!");
    } else {
      toast.error(ERROR_MESSAGES[result.error] ?? "Não foi possível parear.");
    }
  }

  async function handleJoin() {
    const result = await pairing.joinWithCode(codeInput);
    if (result.ok) {
      toast.success("Pareado com sucesso!");
      setJoining(false);
      setCodeInput("");
    } else {
      toast.error(ERROR_MESSAGES[result.error] ?? "Não foi possível parear.");
    }
  }

  async function handleSyncNow() {
    await status.syncNow();
    const latest = syncManager.getStatus();
    if (latest.error) {
      toast.error(syncErrorMessage(latest.error));
    } else {
      toast.success("Sincronizado");
    }
  }

  async function handleUnpair() {
    await status.unpair();
    setConfirmUnpair(false);
    toast("Despareado");
  }

  function handleCopyCode() {
    if (!pairing.code) return;
    navigator.clipboard.writeText(pairing.code);
    toast("Código copiado");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sincronização entre dispositivos</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {pairing.mode === "showing-code" && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Digite este código no outro dispositivo:
            </p>
            <button
              type="button"
              onClick={handleCopyCode}
              className="font-mono text-4xl tracking-widest tabular-nums hover:opacity-80"
            >
              {pairing.code}
            </button>
            <p className="text-xs text-muted-foreground">
              Expira em {formatCountdown(pairing.remainingMs)}
            </p>
            <div className="flex gap-2 mt-2">
              <Button onClick={handleConfirmPaired} disabled={pairing.loading}>
                <CheckIcon /> Já pareei o outro device
              </Button>
              <Button variant="outline" onClick={pairing.cancel}>
                <XIcon /> Cancelar
              </Button>
            </div>
          </div>
        )}

        {pairing.mode === "idle" && !status.isPaired && !joining && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Sincronize seus projetos entre seus dispositivos.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleGenerate} disabled={pairing.loading}>
                Gerar código
              </Button>
              <Button variant="outline" onClick={() => setJoining(true)}>
                Inserir código
              </Button>
            </div>
          </div>
        )}

        {pairing.mode === "idle" && !status.isPaired && joining && (
          <div className="flex flex-col gap-2 max-w-xs">
            <Label htmlFor="pair-code">Código de 6 dígitos</Label>
            <Input
              id="pair-code"
              inputMode="numeric"
              maxLength={6}
              value={codeInput}
              onChange={(e) =>
                setCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              className="font-mono tracking-widest"
            />
            <div className="flex gap-2 mt-1">
              <Button
                onClick={handleJoin}
                disabled={pairing.loading || codeInput.length !== 6}
              >
                Parear
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setJoining(false);
                  setCodeInput("");
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {pairing.mode === "idle" && status.isPaired && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1 text-sm">
              <p>
                Última sincronização:{" "}
                <span className="font-medium">
                  {formatRelativeTime(status.lastSyncedAt)}
                </span>
              </p>
              <p className="text-muted-foreground">
                {deviceCount === null
                  ? "Carregando dispositivos..."
                  : `${deviceCount} dispositivo${deviceCount === 1 ? "" : "s"} no grupo`}
              </p>
              {status.error && (
                <p className="text-destructive">
                  Falha na última sincronização:{" "}
                  {syncErrorMessage(status.error)}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSyncNow}>
                <RefreshCwIcon /> Sincronizar agora
              </Button>
              <Button variant="outline" onClick={handleGenerate}>
                <PlusIcon /> Adicionar dispositivo
              </Button>
              <Button
                variant="destructive"
                onClick={() => setConfirmUnpair(true)}
              >
                <UnlinkIcon /> Desparear
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={confirmUnpair} onOpenChange={setConfirmUnpair}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desparear dispositivo?</DialogTitle>
            <DialogDescription>
              Os dados deste dispositivo continuam aqui, mas ele para de
              sincronizar com os outros. Você pode parear novamente a qualquer
              momento.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmUnpair(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleUnpair}>
              Desparear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
