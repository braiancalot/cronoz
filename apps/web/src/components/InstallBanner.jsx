import { XIcon } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";

export function InstallBanner() {
  const { isInstallable, promptInstall, dismiss } = useInstallPrompt();

  if (!isInstallable) return null;

  return (
    <Card
      size="sm"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md shadow-lg"
    >
      <CardContent className="flex items-center justify-between gap-3">
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
      </CardContent>
    </Card>
  );
}
