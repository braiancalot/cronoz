import { PictureInPictureIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button.jsx";

// Shown in place of the timer while the stopwatch lives in the PiP window, so
// the running timer isn't duplicated on both screens at once. The whole block
// is the button, so clicking anywhere on the message brings the timer back.
// Kept within the timer's own height (its floor is ~6rem) so TimerSlot's box
// holds it and the stage doesn't jump when the PiP opens.
export function PiPPlaceholder({ onClose }) {
  return (
    <Button
      variant="ghost"
      onClick={onClose}
      className="h-auto flex-col gap-1 rounded-2xl px-6 py-3 whitespace-normal text-muted-foreground"
    >
      <PictureInPictureIcon className="size-6" />
      <span>Cronômetro na janela flutuante</span>
      <span className="font-medium text-foreground">Trazer de volta</span>
    </Button>
  );
}
