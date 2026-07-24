import { Input } from "@/components/ui/input.jsx";

export function ProjectTitle({
  isRenaming,
  name,
  draft,
  onDraftChange,
  formProps,
  fieldProps,
}) {
  if (!isRenaming) return <h1 className="text-lg font-medium">{name}</h1>;

  return (
    <form {...formProps} className="w-auto">
      <Input
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        onFocus={(event) => event.target.select()}
        {...fieldProps}
        autoFocus
      />
    </form>
  );
}
