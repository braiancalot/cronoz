import db from "./db.js";

async function get(key) {
  const entry = await db.internal.get(key);
  return entry ? entry.value : undefined;
}

async function set(key, value) {
  await db.internal.put({ key, value });
}

async function remove(key) {
  await db.internal.delete(key);
}

const internalRepository = { get, set, remove };

export default internalRepository;
