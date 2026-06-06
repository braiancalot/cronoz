import db from "./db.js";
import { emitMutation } from "./repoEvents.js";

export const DEFAULTS = {
  hourlyPrice: 10,
  ignoreMilliseconds: false,
};

async function get(key) {
  const entry = await db.settings.get(key);
  return entry ? entry.value : (DEFAULTS[key] ?? null);
}

async function getResolved() {
  const entries = await db.settings.toArray();
  const stored = Object.fromEntries(entries.map((e) => [e.key, e.value]));
  return Object.fromEntries(
    Object.keys(DEFAULTS).map((key) => [
      key,
      key in stored ? stored[key] : DEFAULTS[key],
    ]),
  );
}

async function set(key, value) {
  await db.settings.put({ key, value, updatedAt: Date.now() });
  emitMutation();
}

async function getAll() {
  return db.settings.toArray();
}

// Apply an incoming record from the sync pull. No event — the incoming
// updatedAt is the source of truth for LWW.
async function applyFromSync({ key, value, updatedAt }) {
  await db.settings.put({ key, value, updatedAt });
}

const settingsRepository = { get, getResolved, set, getAll, applyFromSync };

export default settingsRepository;
