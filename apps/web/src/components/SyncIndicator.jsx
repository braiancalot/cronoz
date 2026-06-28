import { Link } from "react-router";
import {
  CloudCheckIcon,
  CloudSlashIcon,
  ArrowsClockwiseIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button.jsx";
import { useSyncStatus } from "@/hooks/useSyncStatus.js";

export function SyncIndicator() {
  const { isPaired, syncing, error, isOnline } = useSyncStatus();

  if (!isPaired) return null;

  let Icon = CloudCheckIcon;
  let className = "text-muted-foreground";
  let label = "Sincronizado";

  if (!isOnline) {
    Icon = CloudSlashIcon;
    className = "text-destructive";
    label = "Offline";
  } else if (syncing) {
    Icon = ArrowsClockwiseIcon;
    className = "text-muted-foreground animate-spin";
    label = "Sincronizando";
  } else if (error) {
    Icon = CloudSlashIcon;
    className = "text-destructive";
    label = "Erro de sincronização";
  }

  return (
    <Button variant="ghost" size="icon-sm" asChild>
      <Link to="/settings" aria-label={label}>
        <Icon className={className} />
      </Link>
    </Button>
  );
}
