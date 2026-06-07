import { useEffect, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

const UPDATE_INTERVAL_MS = 60 * 60 * 1000;

export function useServiceWorkerUpdate() {
  const registrationRef = useRef(null);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      registrationRef.current = registration ?? null;
    },
  });

  useEffect(() => {
    const checkForUpdate = () => {
      if (document.visibilityState !== "visible") return;
      registrationRef.current?.update().catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") checkForUpdate();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    const intervalId = setInterval(checkForUpdate, UPDATE_INTERVAL_MS);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, []);

  return { needRefresh, updateServiceWorker };
}
