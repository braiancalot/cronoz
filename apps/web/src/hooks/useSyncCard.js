import { useEffect, useState } from "react";
import { toast } from "sonner";
import syncManager from "@/services/syncManager.js";
import { usePairing } from "./usePairing.js";
import { useSyncStatus } from "./useSyncStatus.js";

function announcePaired() {
  toast.success("Pareado com sucesso");
}

// Keyed on lastSyncedAt too: a device joining the group never flips isPaired
// here, but it is always followed by a sync.
function useDeviceCount({ isPaired, lastSyncedAt }) {
  const [deviceCount, setDeviceCount] = useState(null);

  useEffect(() => {
    if (!isPaired) return;
    let cancelled = false;
    syncManager.getDeviceCount().then((count) => {
      if (!cancelled && count !== null) setDeviceCount(count);
    });
    return () => {
      cancelled = true;
    };
  }, [isPaired, lastSyncedAt]);

  return isPaired ? deviceCount : null;
}

export function useSyncCard() {
  const pairing = usePairing({ onPaired: announcePaired });
  const status = useSyncStatus();
  const deviceCount = useDeviceCount(status);
  const [codeInput, setCodeInput] = useState("");
  const [confirmUnpair, setConfirmUnpair] = useState(false);

  function editCodeInput(value) {
    setCodeInput(value);
    pairing.clearError();
  }

  function cancelPairing() {
    setCodeInput("");
    pairing.cancel();
  }

  async function join() {
    const joined = await pairing.joinWithCode(codeInput);
    if (joined) setCodeInput("");
  }

  async function unpair() {
    setConfirmUnpair(false);
    await status.unpair();
  }

  function copyCode() {
    navigator.clipboard.writeText(pairing.flow.code);
    toast("Código copiado");
  }

  return {
    flow: pairing.flow,
    status,
    deviceCount,
    codeInput,
    editCodeInput,
    confirmUnpair,
    askUnpair: () => setConfirmUnpair(true),
    dismissUnpair: () => setConfirmUnpair(false),
    generateCode: pairing.generateCode,
    openJoin: pairing.openJoin,
    cancelPairing,
    join,
    unpair,
    copyCode,
  };
}
