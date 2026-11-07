import db from "./db.js";
import { emitMutation } from "./repoEvents.js";
import { DEFAULT_LAP_NAME_TEMPLATE } from "@/lib/lapNameTemplate.js";

export const DEFAULTS = {
  hourlyPrice: 10,
  ignoreMilliseconds: false,
  hideTags: false,
  hidePrice: false,
  lapNameTemplate: DEFAULT_LAP_NAME_TEMPLATE,
};

async function get(key) {
  const entry = await db.settings.get(key);
  return entry ? entry.value : (DEFAULTS[key] ?? null);
}

// The shared schema allows any type under any key, so a mismatch MUST fall back.
function resolveValue(stored, key) {
  const fallback = DEFAULTS[key];
  if (!(key in stored)) return fallback;
  return typeof stored[key] === typeof fallback ? stored[key] : fallback;
}

async function getResolved() {
  const entries = await db.settings.toArray();
  const stored = Object.fromEntries(
    entries.map((entry) => [entry.key, entry.value]),
  );
  return Object.fromEntries(
    Object.keys(DEFAULTS).map((key) => [key, resolveValue(stored, key)]),
  );
}

async function set(key, value) {
  await db.settings.put({ key, value, updatedAt: Date.now() });
  emitMutation();
}

async function getAll() {
  return db.settings.toArray();
}

// Apply an incoming record from the sync pull. No event: the incoming
// updatedAt is the source of truth for LWW.
async function applyFromSync({ key, value, updatedAt }) {
  await db.settings.put({ key, value, updatedAt });
}

const settingsRepository = { get, getResolved, set, getAll, applyFromSync };

export default settingsRepository;
