import { useEffect, useRef } from "react";

export function useWakeLock(active) {
  const sentinelRef = useRef(null);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    if (!("wakeLock" in navigator)) return;

    let cancelled = false;

    const request = async () => {
      try {
        const sentinel = await navigator.wakeLock.request("screen");
        if (cancelled) {
          sentinel.release().catch(() => {});
          return;
        }
        sentinel.addEventListener("release", () => {
          if (sentinelRef.current === sentinel) sentinelRef.current = null;
        });
        sentinelRef.current = sentinel;
      } catch {
        // Ignore: API may reject if document not visible, battery saver, etc.
      }
    };

    const release = () => {
      const sentinel = sentinelRef.current;
      sentinelRef.current = null;
      if (sentinel) sentinel.release().catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        activeRef.current &&
        !sentinelRef.current
      ) {
        request();
      }
    };

    if (active) request();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      release();
    };
  }, [active]);
}
