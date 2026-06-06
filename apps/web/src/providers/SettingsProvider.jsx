import { createContext, useContext } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import settingsRepository, { DEFAULTS } from "@/services/settingsRepository.js";

// Default to DEFAULTS so consumers without a provider (tests) get valid values.
const SettingsContext = createContext(DEFAULTS);

export function SettingsProvider({ children }) {
  const settings = useLiveQuery(() => settingsRepository.getResolved(), []);

  // Gate until settings load once, so consumers never flash a default value.
  if (settings === undefined) return null;

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

export function useHourlyPrice() {
  return useSettings().hourlyPrice;
}
