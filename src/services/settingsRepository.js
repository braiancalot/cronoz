import { getDB } from "./db.js";

const DEFAULTS = {
  hourlyPrice: 10,
};

async function get(key) {
  const db = await getDB();
  const entry = await db.get("settings", key);
  return entry ? entry.value : (DEFAULTS[key] ?? null);
}

async function set(key, value) {
  const db = await getDB();
  await db.put("settings", { key, value });
}

const settingsRepository = { get, set };

export default settingsRepository;
