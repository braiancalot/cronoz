import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";

export function SyncJoinForm({ value, onChange, loading, onSubmit, onCancel }) {
  return (
    <div className="flex flex-col gap-2 max-w-xs">
      <Label htmlFor="pair-code">Código de 6 dígitos</Label>
      <Input
        id="pair-code"
        inputMode="numeric"
        maxLength={6}
        value={value}
        onChange={(e) =>
          onChange(e.target.value.replace(/\D/g, "").slice(0, 6))
        }
        placeholder="000000"
        className="font-mono tracking-widest"
      />
      <div className="flex flex-col gap-2 mt-1 sm:flex-row">
        <Button onClick={onSubmit} disabled={loading || value.length !== 6}>
          Parear
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
