// Sync ships behind a flag so it can land in main while staying off in prod.
// Once it's proven stable there, delete this module and the gates that read it.
export const FEATURES = {
  // Vite env vars are always strings, so anything but "true" — missing,
  // "false", "" — stays off.
  sync: import.meta.env.VITE_SYNC_ENABLED === "true",
};
