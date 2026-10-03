import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { devices, projects, settings, syncGroups } from "../../db/schema.js";
import { verifyToken } from "../../lib/jwt.js";
import {
  DEVICE_A,
  DEVICE_B,
  initiate,
  post,
} from "../../../test/pairingFixtures.js";
import { makeProject } from "../../../test/projectFixtures.js";

async function groupOf(deviceId) {
  const [device] = await db
    .select()
    .from(devices)
    .where(eq(devices.id, deviceId));
  return device?.syncGroupId ?? null;
}

// DEVICE_A generates a code it did not mean to, then types DEVICE_B's.
async function joinAfterOwnCode(seedOwnGroup = async () => {}) {
  await initiate(DEVICE_A);
  const ownGroupId = await groupOf(DEVICE_A);
  await seedOwnGroup(ownGroupId);
  const code = await initiate(DEVICE_B);
  const res = await post("/api/pair/join", { deviceId: DEVICE_A, code });
  return { res, ownGroupId };
}

describe("POST /api/pair/join from a device that generated a code first", () => {
  it("moves the device into the group it joined", async () => {
    const { res } = await joinAfterOwnCode();

    expect(res.status).toBe(200);
    const { token, syncGroupId } = await res.json();
    expect(syncGroupId).toBe(await groupOf(DEVICE_B));
    expect(await groupOf(DEVICE_A)).toBe(syncGroupId);
    expect((await verifyToken(token)).syncGroupId).toBe(syncGroupId);
  });

  it("deletes the group the device left behind", async () => {
    const { ownGroupId } = await joinAfterOwnCode();

    const left = await db
      .select()
      .from(syncGroups)
      .where(eq(syncGroups.id, ownGroupId));
    expect(left).toHaveLength(0);
  });

  it("answers 409 when the device's own group holds projects", async () => {
    const project = makeProject();
    const { res, ownGroupId } = await joinAfterOwnCode((syncGroupId) =>
      db.insert(projects).values({
        id: project.id,
        syncGroupId,
        data: project,
        updatedAt: 1000,
        serverUpdatedAt: 1000,
      }),
    );

    expect(res.status).toBe(409);
    expect(await groupOf(DEVICE_A)).toBe(ownGroupId);
  });

  it("answers 409 when the device's own group holds settings", async () => {
    const { res, ownGroupId } = await joinAfterOwnCode((syncGroupId) =>
      db.insert(settings).values({
        syncGroupId,
        key: "hourlyPrice",
        value: 50,
        updatedAt: 1000,
        serverUpdatedAt: 1000,
      }),
    );

    expect(res.status).toBe(409);
    expect(await groupOf(DEVICE_A)).toBe(ownGroupId);
  });
});
