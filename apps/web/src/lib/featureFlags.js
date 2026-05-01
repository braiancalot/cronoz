// Build-time feature flags backed by Vite env vars.
//
// Why: the sync feature ships behind a flag so it can land in main while
// remaining hidden in production until we're ready to enable it.
//
// Removal criteria: once sync has been stable in production for a while
// without regressions, delete this module, drop the gates in components
// and hooks, and inline whatever lives behind FEATURES.sync today.
export const FEATURES = {
  // Default false: any environment that doesn't explicitly opt in stays off.
  // Comparing against the string "true" is intentional — Vite env vars are
  // always strings, so any other value (missing, "false", "") resolves to false.
  sync: import.meta.env.VITE_SYNC_ENABLED === "true",
};
