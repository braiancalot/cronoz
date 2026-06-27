import { Button } from "@/components/ui/button.jsx";

export function PiPDiscardView({ onConfirm, onCancel }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-4 text-center">
      <p className="text-sm">Descartar tempo atual?</p>
      <div className="flex gap-3">
        <Button variant="ghost" onClick={onCancel}>
          Não
        </Button>
        <Button variant="destructive" onClick={onConfirm}>
          Sim
        </Button>
      </div>
    </div>
  );
}
