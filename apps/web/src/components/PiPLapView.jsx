import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";

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
  const btnSize = size === "mini" ? "sm" : "default";

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
      <div className="flex gap-3">
        <Button variant="ghost" size={btnSize} type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button size={btnSize} type="submit">
          Salvar
        </Button>
      </div>
    </form>
  );
}
