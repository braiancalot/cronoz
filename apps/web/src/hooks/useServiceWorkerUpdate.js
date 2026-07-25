import { useCallback, useEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import {
  hasSimulateFlag,
  hrefWithoutSimulateFlag,
} from "@/lib/updateSimulation.js";

const UPDATE_INTERVAL_MS = 60 * 60 * 1000;

// Dev only: it bypasses useRegisterSW, so in production it would show the
// banner even with the real update plumbing broken.
function readSimulateFlag() {
  if (!import.meta.env.DEV) return false;
  if (typeof window === "undefined") return false;
  return hasSimulateFlag(window.location.search);
}

export function useServiceWorkerUpdate() {
  const registrationRef = useRef(null);
  const [simulated] = useState(readSimulateFlag);

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

  // Ends the way the real update does: a full reload, and gone for good.
  const leaveSimulation = useCallback(() => {
    window.location.replace(hrefWithoutSimulateFlag(window.location.href));
  }, []);

  if (simulated) {
    return { needRefresh: true, updateServiceWorker: leaveSimulation };
  }

  return { needRefresh, updateServiceWorker };
}
