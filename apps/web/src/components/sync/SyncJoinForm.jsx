import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { PAIRING_CODE_LENGTH } from "@cronoz/shared";
import { normalizePairingCode } from "@/lib/pairingCode.js";

export function SyncJoinForm({ value, onChange, loading, onSubmit, onCancel }) {
  return (
    <div className="flex flex-col gap-2 max-w-xs">
      <Label htmlFor="pair-code">Código de pareamento</Label>
      <Input
        id="pair-code"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(normalizePairingCode(e.target.value))}
        placeholder="XXXXXXXX"
        className="font-mono tracking-widest"
      />
      <div className="flex flex-col gap-2 mt-1 sm:flex-row">
        <Button
          onClick={onSubmit}
          disabled={loading || value.length !== PAIRING_CODE_LENGTH}
        >
          Parear
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
