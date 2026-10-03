import { createContext, useContext } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  LAST_SYNCED_AT_KEY,
  PENDING_PAIRING_KEY,
  SYNC_PAIRED_KEY,
  SYNC_REVOKED_KEY,
} from "@cronoz/shared";

import db from "@/services/db.js";

// Default for consumers without a provider (tests); the app always wraps + gates.
const SyncStatusContext = createContext({
  isPaired: false,
  lastSyncedAt: null,
  wasRevoked: false,
  pendingPairing: null,
});

function useInternalRow(key) {
  return useLiveQuery(() => db.internal.get(key).then((row) => row ?? null));
}

export function SyncStatusProvider({ children }) {
  // Map a missing row to null so `undefined` strictly means "still loading".
  const pairedRow = useInternalRow(SYNC_PAIRED_KEY);
  const lastSyncRow = useInternalRow(LAST_SYNCED_AT_KEY);
  const revokedRow = useInternalRow(SYNC_REVOKED_KEY);
  const pendingRow = useInternalRow(PENDING_PAIRING_KEY);

  // Gate on the rows that pick the card's layout (paired, waiting on a code,
  // unpaired) so it paints its final state instead of flashing through
  // another one.
  const layoutRows = [pairedRow, revokedRow, pendingRow];
  if (layoutRows.includes(undefined)) return null;

  const value = {
    isPaired: !!pairedRow?.value,
    lastSyncedAt: lastSyncRow?.value ?? null,
    wasRevoked: !!revokedRow?.value,
    pendingPairing: pendingRow?.value ?? null,
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
