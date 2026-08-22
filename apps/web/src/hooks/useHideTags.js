import { useSettings } from "@/providers/SettingsProvider.jsx";

export function useHideTags() {
  return useSettings().hideTags;
}
