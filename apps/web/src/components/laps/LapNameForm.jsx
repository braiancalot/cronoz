import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button.jsx";
import { useInlineEditForm } from "@/hooks/useInlineEditForm.js";

export function LapNameForm({ value, onChange, onSubmit, onCancel }) {
  const { formProps, fieldProps, keepFocus } = useInlineEditForm({
    value,
    onSubmit,
    onCancel,
  });

  return (
    // min-h-9 holds the row at the height it rests at.
    <form {...formProps} className="flex items-center gap-2 min-h-9 w-full">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...fieldProps}
        className="flex-1 min-w-0 bg-transparent outline-none"
        autoFocus
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="rounded-full"
        {...keepFocus}
        onClick={onCancel}
        aria-label="Cancelar"
        title="Cancelar"
      >
        <XIcon weight="bold" />
      </Button>
      <Button
        type="button"
        size="icon-xs"
        className="rounded-full"
        {...keepFocus}
        onClick={onSubmit}
        aria-label="Salvar"
        title="Salvar"
      >
        <CheckIcon weight="bold" />
      </Button>
    </form>
  );
}
