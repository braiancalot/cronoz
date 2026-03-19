import { XIcon } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { Button } from "@/components/ui/button.jsx";

export function InstallBanner() {
  const { isInstallable, promptInstall, dismiss } = useInstallPrompt();

  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md bg-card rounded-lg p-4 flex items-center justify-between gap-3 shadow-lg">
      <span className="text-sm">Instalar Cronoz</span>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={promptInstall}>
          Instalar
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={dismiss}
          aria-label="Fechar"
        >
          <XIcon />
        </Button>
      </div>
    </div>
  );
}
