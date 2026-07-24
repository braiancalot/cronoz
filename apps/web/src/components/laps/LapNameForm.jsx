import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { useInlineEditForm } from "@/hooks/useInlineEditForm.js";

export function LapNameForm({ value, onChange, onSubmit, onCancel }) {
  const { formProps, fieldProps, keepFocus } = useInlineEditForm({
    value,
    onSubmit,
    onCancel,
  });

  return (
    <form {...formProps} className="flex items-center gap-2 min-h-11 w-full">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...fieldProps}
        className="flex-1 h-8 text-sm"
        autoFocus
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
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
        size="icon-sm"
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
