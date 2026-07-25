import { useState } from "react";
import { UpdateBanner } from "@/components/UpdateBanner.jsx";
import { useServiceWorkerUpdate } from "@/hooks/useServiceWorkerUpdate.js";

export function ReloadPrompt() {
  const { needRefresh, updateServiceWorker } = useServiceWorkerUpdate();
  // Session-scoped: needRefresh stays true, so the banner returns on next load.
  const [dismissed, setDismissed] = useState(false);

  if (!needRefresh || dismissed) return null;

  return (
    <UpdateBanner
      onUpdate={() => updateServiceWorker(true)}
      onDismiss={() => setDismissed(true)}
    />
  );
}
