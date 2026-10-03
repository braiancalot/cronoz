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

// One transaction, so callers racing on a missing key all get the same value.
// makeValue MUST be synchronous: awaiting anything but Dexie inside the
// transaction commits it early.
function getOrCreate(key, makeValue) {
  return db.transaction("rw", db.internal, async () => {
    const entry = await db.internal.get(key);
    if (entry) return entry.value;

    const value = makeValue();
    await db.internal.put({ key, value });
    return value;
  });
}

const internalRepository = { get, set, remove, getOrCreate };

export default internalRepository;
