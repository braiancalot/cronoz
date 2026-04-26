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
  emitMutation("settings");
}

async function getAll() {
  return db.settings.toArray();
}

async function upsertFromSync({ key, value, updatedAt }) {
  await db.settings.put({ key, value, updatedAt });
}

const settingsRepository = { get, set, getAll, upsertFromSync };

export default settingsRepository;
