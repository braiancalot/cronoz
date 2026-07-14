import { toast } from "sonner";

const UNDO_DURATION_MS = 4000;

export function showUndoToast(message, onUndo) {
  toast(message, {
    action: { label: "Desfazer", onClick: onUndo },
    duration: UNDO_DURATION_MS,
  });
}
