import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useLiveQuery } from "dexie-react-hooks";

import settingsRepository, { DEFAULTS } from "@/services/settingsRepository.js";

// Default to DEFAULTS so consumers without a provider (tests) get valid values.
const SettingsContext = createContext(DEFAULTS);
const SetSettingContext = createContext((key, value) =>
  settingsRepository.set(key, value),
);

export function SettingsProvider({ children }) {
  const live = useLiveQuery(() => settingsRepository.getResolved(), []);
  const [pending, setPending] = useState(null);

  // A write resolves before useLiveQuery re-emits, so a switch flipped back
  // for a frame. Any newer live value wins over the pending one.
  const settings = useMemo(() => {
    if (!pending || pending.base !== live) return live;
    return { ...live, ...pending.values };
  }, [live, pending]);

  const setSetting = useCallback(
    (key, value) => {
      setPending((prev) => ({
        base: live,
        values: { ...(prev?.base === live ? prev.values : {}), [key]: value },
      }));
      return settingsRepository.set(key, value);
    },
    [live],
  );

  // Gate until settings load once, so consumers never flash a default value.
  if (settings === undefined) return null;

  return (
    <SettingsContext.Provider value={settings}>
      <SetSettingContext.Provider value={setSetting}>
        {children}
      </SetSettingContext.Provider>
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

export function useSetSetting() {
  return useContext(SetSettingContext);
}

export function useHourlyPrice() {
  return useSettings().hourlyPrice;
}
