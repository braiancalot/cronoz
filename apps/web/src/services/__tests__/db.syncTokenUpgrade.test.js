import { beforeEach, describe, expect, it, vi } from "vitest";
import Dexie from "dexie";
import { SYNC_PAIRED_KEY } from "@cronoz/shared";

const DB_NAME = "cronoz-db";
const LEGACY_SYNC_TOKEN_KEY = "syncToken";

async function createV5Database(internalRows) {
  const legacy = new Dexie(DB_NAME);
  legacy.version(5).stores({
    projects: "id, completedAt, createdAt, updatedAt, deletedAt",
    settings: "key",
    internal: "key",
  });
  await legacy.open();
  await legacy.table("internal").bulkPut(internalRows);
  legacy.close();
}

async function openCurrentDatabase() {
  vi.resetModules();
  const { default: db } = await import("@/services/db.js");
  await db.open();
  return db;
}

async function valueOf(db, key) {
  return (await db.internal.get(key))?.value;
}

beforeEach(async () => {
  await Dexie.delete(DB_NAME);
});

describe("Dexie v5 → v6 migration", () => {
  it("turns a stored sync token into the paired marker", async () => {
    await createV5Database([{ key: LEGACY_SYNC_TOKEN_KEY, value: "jwt" }]);

    const db = await openCurrentDatabase();

    expect(await valueOf(db, SYNC_PAIRED_KEY)).toBe(true);
    expect(await valueOf(db, LEGACY_SYNC_TOKEN_KEY)).toBeUndefined();
    db.close();
  });

  it("leaves a device that had no token unpaired", async () => {
    await createV5Database([{ key: "deviceId", value: "dev-1" }]);

    const db = await openCurrentDatabase();

    expect(await valueOf(db, SYNC_PAIRED_KEY)).toBeUndefined();
    expect(await valueOf(db, "deviceId")).toBe("dev-1");
    db.close();
  });
});
