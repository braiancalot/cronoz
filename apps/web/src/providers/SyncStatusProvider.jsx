import { createContext, useContext } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { LAST_SYNCED_AT_KEY, SYNC_TOKEN_KEY } from "@cronoz/shared";

import db from "@/services/db.js";

// Default for consumers without a provider (tests); the app always wraps + gates.
const SyncStatusContext = createContext({
  isPaired: false,
  lastSyncedAt: null,
});

export function SyncStatusProvider({ children }) {
  // Map a missing row to null so `undefined` strictly means "still loading".
  const tokenRow = useLiveQuery(() =>
    db.internal.get(SYNC_TOKEN_KEY).then((row) => row ?? null),
  );
  const lastSyncRow = useLiveQuery(() =>
    db.internal.get(LAST_SYNCED_AT_KEY).then((row) => row ?? null),
  );

  // Gate on the token (it drives the paired/not-paired layout) so the card
  // paints its final state instead of flashing through a loading layout.
  if (tokenRow === undefined) return null;

  const value = {
    isPaired: !!tokenRow?.value,
    lastSyncedAt: lastSyncRow?.value ?? null,
  };

  return (
    <SyncStatusContext.Provider value={value}>
      {children}
    </SyncStatusContext.Provider>
  );
}

export function useSyncData() {
  return useContext(SyncStatusContext);
}
