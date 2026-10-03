import { formatRelativeTime } from "./syncFormat.js";
import { syncErrorMessage } from "./syncMessages.js";

export function syncStatusLine({ syncing, isOnline, error, lastSyncedAt }) {
  if (syncing) return { text: "Sincronizando…", isError: false };
  if (!isOnline) {
    return {
      text: "Sem conexão. Sincroniza quando a internet voltar.",
      isError: false,
    };
  }
  if (error) return { text: syncErrorMessage(error), isError: true };
  if (!lastSyncedAt) return { text: "Ainda não sincronizado", isError: false };
  return {
    text: `Sincronizado · ${formatRelativeTime(lastSyncedAt)}`,
    isError: false,
  };
}
