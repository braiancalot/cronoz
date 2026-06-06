import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import syncManager from "@/services/syncManager.js";
import { useSyncData } from "@/providers/SyncStatusProvider.jsx";

export function useSyncStatus() {
  const { isPaired, lastSyncedAt } = useSyncData();

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

  const unpair = useCallback(() => syncManager.unpair(), []);
  const syncNow = useCallback(() => syncManager.sync(), []);

  return {
    isPaired,
    lastSyncedAt,
    syncing,
    error,
    isOnline,
    unpair,
    syncNow,
  };
}
