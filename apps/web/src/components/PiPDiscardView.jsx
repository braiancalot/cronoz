import { Button } from "@/components/ui/button.jsx";

const TEXT = { default: "text-lg", compact: "text-base", mini: "text-sm" };

export function PiPDiscardView({ size = "mini", onConfirm, onCancel }) {
  const btnSize = size === "mini" ? "sm" : "default";

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-4 text-center">
      <p className={TEXT[size]}>Descartar tempo atual?</p>
      <div className="flex gap-3">
        <Button variant="ghost" size={btnSize} onClick={onCancel}>
          Não
        </Button>
        <Button variant="destructive" size={btnSize} onClick={onConfirm}>
          Sim
        </Button>
      </div>
    </div>
  );
}
