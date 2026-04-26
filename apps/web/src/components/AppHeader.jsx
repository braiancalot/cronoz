import { SettingsIcon } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button.jsx";
import { SyncIndicator } from "@/components/SyncIndicator.jsx";

export function AppHeader() {
  return (
    <header className="flex py-4 items-center justify-between">
      <div />
      <h1 className="text-lg font-bold tracking-tight">Cronoz</h1>
      <div className="flex items-center gap-1">
        <SyncIndicator />
        <Button variant="ghost" size="icon-sm" asChild>
          <Link to="/settings" aria-label="Configurações">
            <SettingsIcon />
          </Link>
        </Button>
      </div>
    </header>
  );
}
