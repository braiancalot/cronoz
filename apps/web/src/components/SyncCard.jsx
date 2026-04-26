import { useState } from "react";
import { CheckIcon, RefreshCwIcon, UnlinkIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
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

export function SyncCard() {
  const pairing = usePairing();
  const status = useSyncStatus();
  const [joining, setJoining] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [confirmUnpair, setConfirmUnpair] = useState(false);

  async function handleGenerate() {
    await pairing.generateCode();
  }

  async function handleConfirmPaired() {
    await pairing.confirmPaired();
    if (!pairing.error) toast.success("Pareado com sucesso!");
  }

  async function handleJoin() {
    await pairing.joinWithCode(codeInput);
    if (!pairing.error) {
      toast.success("Pareado com sucesso!");
      setJoining(false);
      setCodeInput("");
    } else {
      toast.error(ERROR_MESSAGES[pairing.error] ?? "Não foi possível parear.");
    }
  }

  async function handleSyncNow() {
    await status.syncNow();
    toast("Sincronizado");
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
              Sincronize seus projetos com outro dispositivo (PC + celular,
              etc).
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
                {status.deviceCount === null
                  ? "Carregando dispositivos..."
                  : `${status.deviceCount} dispositivo${status.deviceCount === 1 ? "" : "s"} no grupo`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSyncNow}>
                <RefreshCwIcon /> Sincronizar agora
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
