import { CheckIcon, XIcon } from "@phosphor-icons/react";
import {
  CONTROL_SIZES,
  CONTROL_GAPS,
  CONTROL_ICONS,
} from "@/components/timer/TimerControls.jsx";
import { Button } from "@/components/ui/button.jsx";
import { cn } from "@/lib/utils.js";

// Mirrors the TimerControls arrangement it stands in for, so entering adjust
// mode doesn't slide the buttons sideways.
export function AdjustActions({
  size = "default",
  onCancel,
  onConfirm,
  className,
}) {
  const sizeClass = CONTROL_SIZES[size];
  const iconClass = CONTROL_ICONS[size];

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        CONTROL_GAPS[size],
        className,
      )}
    >
      <Button
        variant="destructive"
        className={cn("rounded-full", sizeClass)}
        onClick={onCancel}
        aria-label="Cancelar"
        title="Cancelar"
      >
        <XIcon weight="regular" className={iconClass} />
      </Button>
      <Button
        className={cn("rounded-full", sizeClass)}
        onClick={onConfirm}
        aria-label="Pronto"
        title="Pronto"
      >
        <CheckIcon weight="regular" className={iconClass} />
      </Button>
    </div>
  );
}
