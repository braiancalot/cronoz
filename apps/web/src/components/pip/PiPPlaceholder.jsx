import { PictureInPictureIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button.jsx";

// Stands in for the timer while the stopwatch lives in the PiP window, so it
// isn't duplicated on both screens. Kept within the timer's own height (floor
// ~6rem) so TimerSlot's box holds it and the stage doesn't jump.
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
