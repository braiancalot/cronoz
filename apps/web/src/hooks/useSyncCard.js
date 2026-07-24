import { useEffect, useState } from "react";
import { toast } from "sonner";
import syncManager from "@/services/syncManager.js";
import {
  pairingErrorMessage,
  syncErrorMessage,
} from "@/components/sync/syncMessages.js";
import { usePairing } from "./usePairing.js";
import { useSyncStatus } from "./useSyncStatus.js";

export function useSyncCard() {
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

  async function generateCode() {
    await pairing.generateCode();
  }

  async function confirmPaired() {
    const result = await pairing.confirmPaired();
    if (result.ok) {
      toast.success("Pareado com sucesso!");
    } else {
      toast.error(pairingErrorMessage(result.error));
    }
  }

  async function join() {
    const result = await pairing.joinWithCode(codeInput);
    if (result.ok) {
      toast.success("Pareado com sucesso!");
      cancelJoin();
    } else {
      toast.error(pairingErrorMessage(result.error));
    }
  }

  function cancelJoin() {
    setJoining(false);
    setCodeInput("");
  }

  async function syncNow() {
    await status.syncNow();
    const latest = syncManager.getStatus();
    if (latest.error) {
      toast.error(syncErrorMessage(latest.error));
    } else {
      toast.success("Sincronizado");
    }
  }

  async function unpair() {
    await status.unpair();
    setConfirmUnpair(false);
    toast("Despareado");
  }

  function copyCode() {
    if (!pairing.code) return;
    navigator.clipboard.writeText(pairing.code);
    toast("Código copiado");
  }

  return {
    pairing,
    status,
    deviceCount,
    joining,
    startJoin: () => setJoining(true),
    cancelJoin,
    codeInput,
    setCodeInput,
    confirmUnpair,
    askUnpair: () => setConfirmUnpair(true),
    dismissUnpair: () => setConfirmUnpair(false),
    generateCode,
    confirmPaired,
    join,
    syncNow,
    unpair,
    copyCode,
  };
}
