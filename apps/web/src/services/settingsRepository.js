import db from "./db.js";
import { emitMutation } from "./repoEvents.js";

const DEFAULTS = {
  hourlyPrice: 10,
};

async function get(key) {
  const entry = await db.settings.get(key);
  return entry ? entry.value : (DEFAULTS[key] ?? null);
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

const settingsRepository = { get, set, getAll, applyFromSync };

export default settingsRepository;
