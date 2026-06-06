import { useSettings } from "@/providers/SettingsProvider.jsx";

export function useIgnoreMilliseconds() {
  return useSettings().ignoreMilliseconds;
}
