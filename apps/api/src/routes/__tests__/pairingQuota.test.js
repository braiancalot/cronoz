import { describe, it, expect } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  devices,
  pairingCodes,
  projects,
  settings,
  syncGroups,
} from "../../db/schema.js";
import { MAX_NEW_GROUPS_PER_HOUR } from "../../lib/groupQuota.js";
import {
  DEVICE_A,
  DEVICE_B,
  DEVICE_C,
  initiate,
  pair,
  post,
} from "../../../test/pairingFixtures.js";
import { makeProject } from "../../../test/projectFixtures.js";

async function seedGroups(count) {
  const rows = Array.from({ length: count }, () => ({}));
  await db.insert(syncGroups).values(rows);
}

async function ageGroups(interval) {
  await db
    .update(syncGroups)
    .set({ createdAt: sql`now() - ${interval}::interval` });
}

async function groupOf(deviceId) {
  const [device] = await db
    .select()
    .from(devices)
    .where(eq(devices.id, deviceId));
  return device?.syncGroupId ?? null;
}

describe("POST /api/pair/initiate new-group quota", () => {
  it("creates groups up to the hourly quota", async () => {
    await seedGroups(MAX_NEW_GROUPS_PER_HOUR - 1);

    const res = await post("/api/pair/initiate", { deviceId: DEVICE_A });
    expect(res.status).toBe(200);
  });

  it("answers 429 once the hourly quota is spent", async () => {
    await seedGroups(MAX_NEW_GROUPS_PER_HOUR);

    const res = await post("/api/pair/initiate", { deviceId: DEVICE_A });
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: "too_many_new_groups" });
    expect(await groupOf(DEVICE_A)).toBeNull();
  });

  it("still serves a device that already has a group", async () => {
    await initiate(DEVICE_A);
    await seedGroups(MAX_NEW_GROUPS_PER_HOUR);

    const res = await post("/api/pair/initiate", { deviceId: DEVICE_A });
    expect(res.status).toBe(200);
  });

  it("ignores groups created more than an hour ago", async () => {
    await seedGroups(MAX_NEW_GROUPS_PER_HOUR);
    await ageGroups("61 minutes");

    const res = await post("/api/pair/initiate", { deviceId: DEVICE_A });
    expect(res.status).toBe(200);
  });
});

describe("POST /api/pair/initiate abandoned-group purge", () => {
  async function initiateThenAge(deviceId, interval) {
    await initiate(deviceId);
    await db.delete(pairingCodes);
    await ageGroups(interval);
    return groupOf(deviceId);
  }

  it("deletes a day-old group that never paired nor synced", async () => {
    await initiateThenAge(DEVICE_A, "25 hours");

    await initiate(DEVICE_C);
    expect(await groupOf(DEVICE_A)).toBeNull();
    expect(await db.select().from(syncGroups)).toHaveLength(1);
  });

  it("keeps a group younger than a day", async () => {
    const groupId = await initiateThenAge(DEVICE_A, "23 hours");

    await initiate(DEVICE_C);
    expect(await groupOf(DEVICE_A)).toBe(groupId);
  });

  it("keeps a paired group", async () => {
    const { syncGroupId } = await pair(DEVICE_A, DEVICE_B);
    await ageGroups("25 hours");

    await initiate(DEVICE_C);
    expect(await groupOf(DEVICE_A)).toBe(syncGroupId);
  });

  it("keeps a lone device that holds projects", async () => {
    const syncGroupId = await initiateThenAge(DEVICE_A, "25 hours");
    const project = makeProject();
    await db.insert(projects).values({
      id: project.id,
      syncGroupId,
      data: project,
      updatedAt: 1000,
      serverUpdatedAt: 1000,
    });

    await initiate(DEVICE_C);
    expect(await groupOf(DEVICE_A)).toBe(syncGroupId);
  });

  it("keeps a lone device that holds settings", async () => {
    const syncGroupId = await initiateThenAge(DEVICE_A, "25 hours");
    await db.insert(settings).values({
      syncGroupId,
      key: "hourlyPrice",
      value: 50,
      updatedAt: 1000,
      serverUpdatedAt: 1000,
    });

    await initiate(DEVICE_C);
    expect(await groupOf(DEVICE_A)).toBe(syncGroupId);
  });

  it("keeps an old group whose device is showing a live code", async () => {
    await initiate(DEVICE_A);
    await ageGroups("25 hours");
    const groupId = await groupOf(DEVICE_A);

    await initiate(DEVICE_C);
    expect(await groupOf(DEVICE_A)).toBe(groupId);
  });
});
