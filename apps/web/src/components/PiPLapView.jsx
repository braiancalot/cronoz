import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";

export function PiPLapView({ value, onChange, onSubmit, onCancel }) {
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
      <p className="text-sm">Nome da volta</p>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={(event) => event.target.select()}
        onKeyDown={(event) => event.key === "Escape" && onCancel()}
        className="h-8 text-sm"
        autoFocus
      />
      <div className="flex gap-3">
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}
