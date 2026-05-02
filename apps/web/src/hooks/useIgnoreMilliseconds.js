import { useLiveQuery } from "dexie-react-hooks";

import settingsRepository from "@/services/settingsRepository.js";

export function useIgnoreMilliseconds() {
  return useLiveQuery(
    () => settingsRepository.get("ignoreMilliseconds"),
    [],
    false,
  );
}
