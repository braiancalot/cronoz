import { useEffect } from "react";
import { toast } from "sonner";
import { useServiceWorkerUpdate } from "@/hooks/useServiceWorkerUpdate.js";

const TOAST_ID = "sw-update";

export function ReloadPrompt() {
  const { needRefresh, updateServiceWorker } = useServiceWorkerUpdate();

  useEffect(() => {
    if (!needRefresh) return;

    toast("Nova versão disponível", {
      id: TOAST_ID,
      duration: Infinity,
      action: {
        label: "Atualizar",
        onClick: () => updateServiceWorker(true),
      },
    });
  }, [needRefresh, updateServiceWorker]);

  return null;
}
