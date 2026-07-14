// Shared behavior for an inline name editor with explicit save/cancel controls
// (rename a lap, add a lap, rename a project). Layout stays with each consumer;
// this only owns the interaction:
//   - Enter or the save action commits; Escape or the cancel action discards.
//   - Clicking away (blur) commits a non-empty value, or discards an empty one.
//   - keepFocus keeps the input focused while a button is pressed so the
//     blur-commit doesn't race the click — otherwise ✕ would commit before it
//     could cancel, and ✓ could fire twice.
export function useInlineEditForm({ value, onSubmit, onCancel }) {
  function handleSubmit(event) {
    event?.preventDefault();
    onSubmit();
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") onCancel();
    else if (event.key === "Enter") {
      event.preventDefault();
      onSubmit();
    }
  }

  function handleBlur() {
    if (value) onSubmit();
    else onCancel();
  }

  const keepFocus = {
    onMouseDown: (event) => event.preventDefault(),
    onPointerDown: (event) => event.preventDefault(),
  };

  return {
    formProps: { onSubmit: handleSubmit },
    fieldProps: { onKeyDown: handleKeyDown, onBlur: handleBlur },
    keepFocus,
  };
}
