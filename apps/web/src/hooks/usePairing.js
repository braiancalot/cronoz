import { useCallback, useEffect, useReducer } from "react";
import { PENDING_PAIRING_KEY } from "@cronoz/shared";
import deviceService from "@/services/deviceService.js";
import internalRepository from "@/services/internalRepository.js";
import syncManager from "@/services/syncManager.js";
import syncService, { SyncError } from "@/services/syncService.js";
import { useSyncData } from "@/providers/SyncStatusProvider.jsx";
import { initPairingFlow, pairingFlowReducer } from "@/lib/pairingFlow.js";

const HOST_POLL_MS = 2000;

function initiateErrorCode(err) {
  if (!(err instanceof SyncError)) return "unknown_error";
  return err.status === 429 ? "too_many_new_groups" : err.message;
}

function joinErrorCode(err) {
  if (!(err instanceof SyncError)) return "unknown_error";
  if (err.status === 400) return "invalid_or_expired_code";
  if (err.status === 409) return "device_already_paired";
  return err.message;
}

async function issuePairingCode() {
  const credential = await deviceService.getDeviceCredential();
  const issued = await syncService.pairInitiate({ credential });
  const pending = {
    code: issued.code,
    expiresAt: new Date(issued.expiresAt).getTime(),
  };
  // Stored so leaving the page does not strand a host that is not marked
  // paired yet.
  await internalRepository.set(PENDING_PAIRING_KEY, pending);
  return pending;
}

async function readHostStatus({ code, expiresAt }) {
  try {
    const credential = await deviceService.getDeviceCredential();
    const { status } = await syncService.pairStatus({ credential, code });
    return status;
  } catch {
    // Server unreachable: only the local clock can end the wait.
    return Date.now() >= expiresAt ? "expired" : "waiting";
  }
}

async function settleHostStatus({ code, expiresAt, dispatch, onPaired }) {
  const status = await readHostStatus({ code, expiresAt });
  if (status !== "joined") {
    dispatch({ type: "host_status", code, status });
    return;
  }
  // Marked first: a failure in between leaves a stale code, not a host that
  // never learns it was paired.
  await syncManager.adoptPairing();
  await internalRepository.remove(PENDING_PAIRING_KEY);
  dispatch({ type: "reset" });
  onPaired();
}

function useHostPolling({ flow, dispatch, onPaired, pollMs }) {
  const { code, expiresAt } = flow;
  const isWaiting = flow.screen === "hosting" && flow.hostState === "waiting";

  useEffect(() => {
    if (!isWaiting) return;
    let settling = false;
    const poll = async () => {
      if (settling) return;
      settling = true;
      // A failed local write leaves the code as joined; the next poll retries.
      await settleHostStatus({ code, expiresAt, dispatch, onPaired }).catch(
        () => {},
      );
      settling = false;
    };
    poll();
    const id = setInterval(poll, pollMs);
    return () => clearInterval(id);
  }, [isWaiting, code, expiresAt, dispatch, onPaired, pollMs]);
}

// onPaired MUST be stable across renders: it restarts the host polling.
export function usePairing({ onPaired, pollMs = HOST_POLL_MS }) {
  const { pendingPairing } = useSyncData();
  const [flow, dispatch] = useReducer(
    pairingFlowReducer,
    pendingPairing,
    initPairingFlow,
  );

  useHostPolling({ flow, dispatch, onPaired, pollMs });

  const generateCode = useCallback(async () => {
    dispatch({ type: "generate_started" });
    try {
      dispatch({ type: "code_issued", ...(await issuePairingCode()) });
    } catch (err) {
      dispatch({ type: "generate_failed", error: initiateErrorCode(err) });
    }
  }, []);

  const joinWithCode = useCallback(
    async (code) => {
      dispatch({ type: "join_started" });
      try {
        const credential = await deviceService.getDeviceCredential();
        await syncService.pairJoin({ credential, code });
        await syncManager.adoptPairing();
        dispatch({ type: "reset" });
        onPaired();
        return true;
      } catch (err) {
        dispatch({ type: "join_failed", error: joinErrorCode(err) });
        return false;
      }
    },
    [onPaired],
  );

  const cancel = useCallback(async () => {
    dispatch({ type: "reset" });
    await internalRepository.remove(PENDING_PAIRING_KEY);
  }, []);

  return {
    flow,
    generateCode,
    joinWithCode,
    cancel,
    openJoin: useCallback(() => dispatch({ type: "join_opened" }), []),
    clearError: useCallback(() => dispatch({ type: "error_cleared" }), []),
  };
}
