import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { LAST_SYNCED_AT_KEY, SYNC_TOKEN_KEY } from "@cronoz/shared";
import db from "@/services/db.js";
import syncManager from "@/services/syncManager.js";
import syncService from "@/services/syncService.js";

export function useSyncStatus() {
  const tokenRow = useLiveQuery(() => db.internal.get(SYNC_TOKEN_KEY));
  const lastSyncRow = useLiveQuery(() => db.internal.get(LAST_SYNCED_AT_KEY));

  const isPaired = !!tokenRow?.value;
  const lastSyncedAt = lastSyncRow?.value ?? null;

  const { syncing, error } = useSyncExternalStore(
    syncManager.subscribe,
    syncManager.getStatus,
  );

  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const [deviceCount, setDeviceCount] = useState(null);

  useEffect(() => {
    if (!isPaired || !tokenRow?.value) {
      setDeviceCount(null);
      return;
    }
    let cancelled = false;
    syncService.getDeviceCount({ token: tokenRow.value }).then(
      ({ count }) => {
        if (!cancelled) setDeviceCount(count);
      },
      () => {
        if (!cancelled) setDeviceCount(null);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [isPaired, lastSyncedAt, tokenRow?.value]);

  const unpair = useCallback(() => syncManager.unpair(), []);
  const syncNow = useCallback(() => syncManager.sync(), []);

  return {
    isPaired,
    lastSyncedAt,
    deviceCount,
    syncing,
    error,
    isOnline,
    unpair,
    syncNow,
  };
}
