import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { PAIRING_CODE_LENGTH } from "@cronoz/shared";
import { normalizePairingCode } from "@/lib/pairingCode.js";
import { pairingErrorMessage } from "./syncMessages.js";

export function SyncJoinForm({
  value,
  onChange,
  busy,
  error,
  onSubmit,
  onCancel,
}) {
  const isComplete = value.length === PAIRING_CODE_LENGTH;

  function submit(event) {
    event.preventDefault();
    if (isComplete && !busy) onSubmit();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 max-w-xs">
      <Label htmlFor="pair-code">Código mostrado no outro dispositivo</Label>
      <Input
        id="pair-code"
        autoFocus
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(normalizePairingCode(e.target.value))}
        placeholder="XXXXXXXX"
        aria-invalid={!!error}
        aria-describedby={error ? "pair-code-error" : undefined}
        className="font-mono tracking-widest"
      />
      {error && (
        <p
          id="pair-code-error"
          role="alert"
          className="text-sm text-destructive"
        >
          {pairingErrorMessage(error)}
        </p>
      )}
      <div className="flex flex-col gap-2 mt-1 sm:flex-row">
        <Button type="submit" disabled={busy || !isComplete}>
          {busy ? "Pareando…" : "Parear"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Voltar
        </Button>
      </div>
    </form>
  );
}
