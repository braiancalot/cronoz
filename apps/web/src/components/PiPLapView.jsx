import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { CONTROL_SIZES, CONTROL_GAPS } from "@/components/TimerControls.jsx";
import { cn } from "@/lib/utils.js";

const TEXT = { default: "text-lg", compact: "text-base", mini: "text-sm" };
const INPUT = {
  default: "h-11 text-lg",
  compact: "h-10 text-base",
  mini: "h-8 text-sm",
};

export function PiPLapView({
  size = "mini",
  value,
  onChange,
  onSubmit,
  onCancel,
}) {
  const sizeClass = CONTROL_SIZES[size];

  function handleSubmit(event) {
    event.preventDefault();
    if (!value) return;
    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full w-full flex-col items-center justify-center gap-3 p-4"
    >
      <p className={TEXT[size]}>Nome da volta</p>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={(event) => event.target.select()}
        onKeyDown={(event) => event.key === "Escape" && onCancel()}
        className={INPUT[size]}
        autoFocus
      />
      <div className={cn("flex items-center", CONTROL_GAPS[size])}>
        <Button
          type="button"
          variant="ghost"
          className={cn("rounded-full bg-muted", sizeClass)}
          onClick={onCancel}
          aria-label="Cancelar"
          title="Cancelar"
        >
          <XIcon weight="bold" />
        </Button>
        <Button
          type="submit"
          className={cn("rounded-full", sizeClass)}
          aria-label="Salvar"
          title="Salvar"
        >
          <CheckIcon weight="bold" />
        </Button>
      </div>
    </form>
  );
}
