import { toast } from "sonner";

const UNDO_DURATION_MS = 4000;

// For undos that land on the project list. It scrolls, so a toast over a row
// costs nothing, and the page is spared reserving space at the top for one.
export const UNDO_ON_LIST = { position: "bottom-center" };

export function showUndoToast(message, onUndo, { position } = {}) {
  toast(message, {
    action: { label: "Desfazer", onClick: onUndo },
    duration: UNDO_DURATION_MS,
    position,
  });
}
