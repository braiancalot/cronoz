import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { ConfirmDialog } from "@/components/ConfirmDialog.jsx";
import { useSyncCard } from "@/hooks/useSyncCard.js";
import { SyncJoinForm } from "./SyncJoinForm.jsx";
import { SyncPairedPanel } from "./SyncPairedPanel.jsx";
import { SyncPairingCode } from "./SyncPairingCode.jsx";
import { SyncPairingStart } from "./SyncPairingStart.jsx";

export function SyncCard() {
  const sync = useSyncCard();
  const { pairing, status } = sync;
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
            onCopy={sync.copyCode}
            onConfirm={sync.confirmPaired}
            onCancel={pairing.cancel}
          />
        )}

        {isIdle && !status.isPaired && !sync.joining && (
          <SyncPairingStart
            loading={pairing.loading}
            onGenerate={sync.generateCode}
            onJoin={sync.startJoin}
          />
        )}

        {isIdle && !status.isPaired && sync.joining && (
          <SyncJoinForm
            value={sync.codeInput}
            onChange={sync.setCodeInput}
            loading={pairing.loading}
            onSubmit={sync.join}
            onCancel={sync.cancelJoin}
          />
        )}

        {isIdle && status.isPaired && (
          <SyncPairedPanel
            lastSyncedAt={status.lastSyncedAt}
            deviceCount={sync.deviceCount}
            error={status.error}
            onSyncNow={sync.syncNow}
            onAddDevice={sync.generateCode}
            onUnpair={sync.askUnpair}
          />
        )}
      </CardContent>

      <ConfirmDialog
        open={sync.confirmUnpair}
        title="Desparear dispositivo?"
        description="Os dados deste dispositivo continuam aqui, mas ele para de sincronizar com os outros. Você pode parear novamente a qualquer momento."
        confirmLabel="Desparear"
        cancelLabel="Cancelar"
        onConfirm={sync.unpair}
        onCancel={sync.dismissUnpair}
      />
    </Card>
  );
}
