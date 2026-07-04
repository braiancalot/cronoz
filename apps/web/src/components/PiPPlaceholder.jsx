import { PictureInPictureIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button.jsx";
import { EmptyState } from "@/components/EmptyState.jsx";

// Shown in place of the timer while the stopwatch lives in the PiP window, so
// the running timer isn't duplicated on both screens at once.
export function PiPPlaceholder({ onClose }) {
  return (
    <EmptyState
      message={
        <span className="flex flex-col items-center gap-3">
          <PictureInPictureIcon className="size-8 text-muted-foreground" />
          Cronômetro na janela flutuante
        </span>
      }
    >
      <Button variant="secondary" className="mt-4" onClick={onClose}>
        Trazer de volta
      </Button>
    </EmptyState>
  );
}
