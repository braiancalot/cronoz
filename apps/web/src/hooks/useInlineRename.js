import { useCallback, useEffect, useState } from "react";

// Optimistic display: the submitted name is held until the live `currentName`
// catches up, hiding the one-frame flash of the old name while useLiveQuery
// re-emits. Released on any `currentName` change, so a sync rename still wins.
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
