import { useCallback, useEffect, useState } from "react";
import { SYNC_TOKEN_KEY } from "@cronoz/shared";
import deviceService from "@/services/deviceService.js";
import internalRepository from "@/services/internalRepository.js";
import syncManager from "@/services/syncManager.js";
import syncService, { SyncError } from "@/services/syncService.js";

export function usePairing() {
  const [mode, setMode] = useState("idle");
  const [code, setCode] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (mode !== "showing-code" || !expiresAt) return;
    const tick = () => {
      const ms = Math.max(0, expiresAt - Date.now());
      setRemainingMs(ms);
      if (ms <= 0) {
        setMode("idle");
        setCode(null);
        setExpiresAt(null);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [mode, expiresAt]);

  const generateCode = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const deviceId = await deviceService.getOrCreateDeviceId();
      const { code, expiresAt } = await syncService.pairInitiate({ deviceId });
      setCode(code);
      setExpiresAt(new Date(expiresAt).getTime());
      setMode("showing-code");
    } catch (err) {
      setError(err instanceof SyncError ? err.message : "unknown_error");
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmPaired = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const deviceId = await deviceService.getOrCreateDeviceId();
      const { token } = await syncService.refreshToken({ deviceId });
      await internalRepository.set(SYNC_TOKEN_KEY, token);
      setMode("idle");
      setCode(null);
      setExpiresAt(null);
      syncManager.sync();
    } catch (err) {
      setError(err instanceof SyncError ? err.message : "unknown_error");
    } finally {
      setLoading(false);
    }
  }, []);

  const joinWithCode = useCallback(async (codeInput) => {
    setLoading(true);
    setError(null);
    try {
      const deviceId = await deviceService.getOrCreateDeviceId();
      const { token } = await syncService.pairJoin({
        deviceId,
        code: codeInput,
      });
      await internalRepository.set(SYNC_TOKEN_KEY, token);
      setMode("idle");
      setCode(null);
      setExpiresAt(null);
      syncManager.sync();
    } catch (err) {
      if (err instanceof SyncError && err.status === 400) {
        setError("invalid_or_expired_code");
      } else if (err instanceof SyncError && err.status === 409) {
        setError("device_already_paired");
      } else {
        setError(err instanceof SyncError ? err.message : "unknown_error");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const cancel = useCallback(() => {
    setMode("idle");
    setCode(null);
    setExpiresAt(null);
    setError(null);
  }, []);

  return {
    mode,
    code,
    remainingMs,
    loading,
    error,
    generateCode,
    confirmPaired,
    joinWithCode,
    cancel,
  };
}
