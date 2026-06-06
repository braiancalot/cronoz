import { useCallback, useEffect, useState } from "react";

// Inline rename with optimistic display: after submit the new value shows
// immediately and is held until the live `currentName` catches up, avoiding the
// one-frame flash of the old name (Dexie's useLiveQuery re-emits a tick later).
// Released whenever `currentName` changes (not by equality) so a divergent
// external/sync rename wins.
export function useInlineRename(currentName, onRename) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [optimisticName, setOptimisticName] = useState(null);

  const displayName = optimisticName ?? currentName;

  useEffect(() => {
    setOptimisticName(null);
  }, [currentName]);

  const start = useCallback(() => {
    setDraft(currentName);
    setIsEditing(true);
  }, [currentName]);

  const cancel = useCallback(() => {
    setIsEditing(false);
    setDraft("");
  }, []);

  const submit = useCallback(async () => {
    if (!draft) return;
    setOptimisticName(draft);
    setIsEditing(false);
    setDraft("");
    await onRename(draft);
  }, [draft, onRename]);

  return { isEditing, draft, setDraft, displayName, start, cancel, submit };
}
