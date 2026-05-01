import { useEffect } from "react";
import { FEATURES } from "@/lib/featureFlags.js";
import syncManager from "@/services/syncManager.js";

export function useSyncManager() {
  useEffect(() => {
    if (!FEATURES.sync) return;
    const unsubscribe = syncManager.start();
    syncManager.sync();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncManager.sync();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      unsubscribe();
    };
  }, []);
}
