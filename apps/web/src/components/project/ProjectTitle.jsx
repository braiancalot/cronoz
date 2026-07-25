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
    <form {...formProps} className="flex-1 min-w-0">
      <input
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        onFocus={(event) => event.target.select()}
        {...fieldProps}
        className="w-full min-w-0 bg-transparent text-lg font-medium outline-none"
        autoFocus
      />
    </form>
  );
}
