import { useState } from "react";
import { MAX_SETTING_STRING_LENGTH } from "@cronoz/shared";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { LapNameTemplateHelp } from "@/components/laps/LapNameTemplateHelp.jsx";
import { renderLapName } from "@/lib/lapNameTemplate.js";

function previewSentence(template) {
  const name = renderLapName({
    template,
    lapNumber: 1,
    date: new Date(),
  }).trim();
  if (!name) return "A volta começa em branco.";
  return `A volta já vem escrita, como ${name}.`;
}

// Bound to the stored value, a re-emitted older write rolls back the typed text.
export function LapNameTemplateField({ template, onChange }) {
  const [draft, setDraft] = useState(null);
  const shown = draft ?? template;

  function handleChange(event) {
    setDraft(event.target.value);
    onChange(event.target.value);
  }

  function handleUseExample(example) {
    setDraft(null);
    onChange(example);
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="lap-name-template">Nome da nova volta</Label>
        <p className="text-xs text-muted-foreground">
          {previewSentence(shown)}
        </p>
        <LapNameTemplateHelp onUse={handleUseExample} />
      </div>
      <Input
        id="lap-name-template"
        value={shown}
        onChange={handleChange}
        onBlur={() => setDraft(null)}
        maxLength={MAX_SETTING_STRING_LENGTH}
        autoComplete="off"
        className="w-40 shrink-0"
      />
    </div>
  );
}
