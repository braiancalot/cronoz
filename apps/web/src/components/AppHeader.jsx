import { Link } from "react-router";
import { Button } from "@/components/ui/button.jsx";

export function AppHeader() {
  return (
    <header className="flex py-4 items-center justify-between">
      <div />
      <h1 className="text-lg font-bold tracking-tight">Cronoz</h1>
      <Button variant="ghost" size="icon-sm" asChild>
        <Link to="/settings" aria-label="Configurações">
          ⚙
        </Link>
      </Button>
    </header>
  );
}
