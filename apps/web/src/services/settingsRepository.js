import db from "./db.js";

const DEFAULTS = {
  hourlyPrice: 10,
};

async function get(key) {
  const entry = await db.settings.get(key);
  return entry ? entry.value : (DEFAULTS[key] ?? null);
}

async function set(key, value) {
  await db.settings.put({ key, value });
}

const settingsRepository = { get, set };

export default settingsRepository;
