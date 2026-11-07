import { useSettings } from "@/providers/SettingsProvider.jsx";
import { renderLapName } from "@/lib/lapNameTemplate.js";

export function useNextLapName() {
  const { lapNameTemplate } = useSettings();
  return (lapNumber) =>
    renderLapName({ template: lapNameTemplate, lapNumber, date: new Date() });
}
