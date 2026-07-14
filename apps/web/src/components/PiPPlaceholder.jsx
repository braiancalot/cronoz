import { PictureInPictureIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button.jsx";

// Shown in place of the timer while the stopwatch lives in the PiP window, so
// the running timer isn't duplicated on both screens at once. The whole block
// is the button, so clicking anywhere on the message brings the timer back.
export function PiPPlaceholder({ onClose }) {
  return (
    <div className="flex flex-col items-center">
      <Button
        variant="ghost"
        onClick={onClose}
        className="h-auto flex-col gap-3 rounded-2xl px-8 py-8 whitespace-normal text-muted-foreground"
      >
        <PictureInPictureIcon className="size-8" />
        <span>Cronômetro na janela flutuante</span>
        <span className="mt-1 text-sm font-medium text-foreground">
          Trazer de volta
        </span>
      </Button>
    </div>
  );
}
