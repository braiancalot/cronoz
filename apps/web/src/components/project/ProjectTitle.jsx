export function ProjectTitle({
  isRenaming,
  name,
  draft,
  onDraftChange,
  formProps,
  fieldProps,
}) {
  // min-w-0 or the truncate never fires: as a flex item the h1 refuses to
  // shrink past its longest word and pushes the menu off the row instead.
  if (!isRenaming)
    return <h1 className="min-w-0 truncate text-lg font-medium">{name}</h1>;

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
