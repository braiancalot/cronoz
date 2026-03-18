import { useState, useEffect, useCallback } from "react";

const DISMISSED_KEY = "cronoz-install-dismissed";

export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(display-mode: standalone)").matches;
  });

  useEffect(() => {
    if (isInstalled) return;

    function handleBeforeInstallPrompt(e) {
      e.preventDefault();
      setPromptEvent(e);
    }

    function handleAppInstalled() {
      setIsInstalled(true);
      setPromptEvent(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isInstalled]);

  const isDismissed =
    typeof window !== "undefined" &&
    localStorage.getItem(DISMISSED_KEY) === "true";

  const isInstallable = !!promptEvent && !isInstalled && !isDismissed;

  const promptInstall = useCallback(async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") {
      setPromptEvent(null);
    }
  }, [promptEvent]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setPromptEvent(null);
  }, []);

  return { isInstallable, promptInstall, dismiss };
}
