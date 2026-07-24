import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button.jsx";

export function ProjectRenameActions({ keepFocus, onCancel, onSubmit }) {
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        title="Cancelar"
        aria-label="Cancelar"
        {...keepFocus}
        onClick={onCancel}
      >
        <XIcon />
      </Button>
      <Button
        size="icon"
        title="Salvar"
        aria-label="Salvar"
        {...keepFocus}
        onClick={onSubmit}
      >
        <CheckIcon />
      </Button>
    </>
  );
}
