import { useSettings } from "@/providers/SettingsProvider.jsx";

export function useHidePrice() {
  return useSettings().hidePrice;
}
