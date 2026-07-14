import { GearIcon } from "@phosphor-icons/react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button.jsx";
import { SyncIndicator } from "@/components/SyncIndicator.jsx";
import { FEATURES } from "@/lib/featureFlags.js";

export function AppHeader() {
  return (
    <header className="grid grid-cols-3 py-4 items-center">
      <div />
      <h1 className="text-center text-lg font-bold tracking-tight">Cronoz</h1>
      <div className="flex items-center justify-end gap-1">
        {FEATURES.sync && <SyncIndicator />}
        <Button variant="ghost" size="icon-sm" asChild>
          <Link to="/settings" aria-label="Configurações">
            <GearIcon />
          </Link>
        </Button>
      </div>
    </header>
  );
}
