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
import { SyncPairingEnded } from "./SyncPairingEnded.jsx";
import { SyncPairingStart } from "./SyncPairingStart.jsx";

function SyncCardBody({ sync }) {
  const { flow, status } = sync;

  if (flow.screen === "hosting" && flow.hostState === "waiting") {
    return (
      <SyncPairingCode
        code={flow.code}
        expiresAt={flow.expiresAt}
        onCopy={sync.copyCode}
        onCancel={sync.cancelPairing}
      />
    );
  }
  if (flow.screen === "hosting") {
    return (
      <SyncPairingEnded
        hostState={flow.hostState}
        busy={flow.busy}
        isOnline={status.isOnline}
        error={flow.error}
        onRegenerate={sync.generateCode}
        onCancel={sync.cancelPairing}
      />
    );
  }
  if (status.isPaired) {
    return (
      <SyncPairedPanel
        status={status}
        deviceCount={sync.deviceCount}
        busy={flow.busy}
        pairingError={flow.error}
        onSyncNow={status.syncNow}
        onAddDevice={sync.generateCode}
        onUnpair={sync.askUnpair}
      />
    );
  }
  if (flow.screen === "joining") {
    return (
      <SyncJoinForm
        value={sync.codeInput}
        onChange={sync.editCodeInput}
        busy={flow.busy}
        error={flow.error}
        onSubmit={sync.join}
        onCancel={sync.cancelPairing}
      />
    );
  }
  return (
    <SyncPairingStart
      busy={flow.busy}
      isOnline={status.isOnline}
      wasRevoked={status.wasRevoked}
      error={flow.error}
      onGenerate={sync.generateCode}
      onJoin={sync.openJoin}
    />
  );
}

export function SyncCard() {
  const sync = useSyncCard();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sincronização entre dispositivos</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <SyncCardBody sync={sync} />
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
