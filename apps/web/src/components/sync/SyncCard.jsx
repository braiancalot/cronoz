import { useEffect, useState } from "react";
import { toast } from "sonner";
import syncManager from "@/services/syncManager.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { ConfirmDialog } from "@/components/ConfirmDialog.jsx";
import { usePairing } from "@/hooks/usePairing.js";
import { useSyncStatus } from "@/hooks/useSyncStatus.js";
import { SyncJoinForm } from "./SyncJoinForm.jsx";
import { SyncPairedPanel } from "./SyncPairedPanel.jsx";
import { SyncPairingCode } from "./SyncPairingCode.jsx";
import { SyncPairingStart } from "./SyncPairingStart.jsx";
import { pairingErrorMessage, syncErrorMessage } from "./syncMessages.js";

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
      toast.error(pairingErrorMessage(result.error));
    }
  }

  async function handleJoin() {
    const result = await pairing.joinWithCode(codeInput);
    if (result.ok) {
      toast.success("Pareado com sucesso!");
      setJoining(false);
      setCodeInput("");
    } else {
      toast.error(pairingErrorMessage(result.error));
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

  function handleCancelJoin() {
    setJoining(false);
    setCodeInput("");
  }

  const isIdle = pairing.mode === "idle";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sincronização entre dispositivos</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {pairing.mode === "showing-code" && (
          <SyncPairingCode
            code={pairing.code}
            remainingMs={pairing.remainingMs}
            loading={pairing.loading}
            onCopy={handleCopyCode}
            onConfirm={handleConfirmPaired}
            onCancel={pairing.cancel}
          />
        )}

        {isIdle && !status.isPaired && !joining && (
          <SyncPairingStart
            loading={pairing.loading}
            onGenerate={handleGenerate}
            onJoin={() => setJoining(true)}
          />
        )}

        {isIdle && !status.isPaired && joining && (
          <SyncJoinForm
            value={codeInput}
            onChange={setCodeInput}
            loading={pairing.loading}
            onSubmit={handleJoin}
            onCancel={handleCancelJoin}
          />
        )}

        {isIdle && status.isPaired && (
          <SyncPairedPanel
            lastSyncedAt={status.lastSyncedAt}
            deviceCount={deviceCount}
            error={status.error}
            onSyncNow={handleSyncNow}
            onAddDevice={handleGenerate}
            onUnpair={() => setConfirmUnpair(true)}
          />
        )}
      </CardContent>

      <ConfirmDialog
        open={confirmUnpair}
        title="Desparear dispositivo?"
        description="Os dados deste dispositivo continuam aqui, mas ele para de sincronizar com os outros. Você pode parear novamente a qualquer momento."
        confirmLabel="Desparear"
        cancelLabel="Cancelar"
        onConfirm={handleUnpair}
        onCancel={() => setConfirmUnpair(false)}
      />
    </Card>
  );
}
