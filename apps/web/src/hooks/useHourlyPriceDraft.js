import { useState } from "react";

// The field keeps what the user typed. Bound to the stored price, a value that
// cannot be saved (an emptied field) snapped back on every keystroke.
export function useHourlyPriceDraft({ storedPrice, onSave }) {
  const [draft, setDraft] = useState(null);

  function handleChange(event) {
    const text = event.target.value;
    setDraft(text);
    const value = parseFloat(text);
    if (!isNaN(value) && value >= 0) onSave(value);
  }

  return {
    value: draft ?? storedPrice,
    onChange: handleChange,
    onBlur: () => setDraft(null),
  };
}
