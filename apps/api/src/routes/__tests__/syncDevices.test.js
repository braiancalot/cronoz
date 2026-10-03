import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import app from "../../app.js";
import { db } from "../../db/index.js";
import { devices, syncCursors, syncGroups } from "../../db/schema.js";
import {
  DEVICE_A,
  DEVICE_B,
  DEVICE_C,
  DEVICE_D,
  credentialOf,
  initiate,
  join,
  pair,
  post,
} from "../../../test/pairingFixtures.js";

describe("GET /api/sync/devices", () => {
  it("returns 401 without Authorization", async () => {
    const res = await app.request("/api/sync/devices");
    expect(res.status).toBe(401);
  });

  it("returns the device count for the sync group", async () => {
    const { credential } = await pair(DEVICE_A, DEVICE_B);

    const res = await app.request("/api/sync/devices", {
      headers: { Authorization: `Bearer ${credential}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(2);
  });

  it("isolates count per sync group", async () => {
    const { credential: credentialAB } = await pair(DEVICE_A, DEVICE_B);
    await pair(DEVICE_C, DEVICE_D);

    const res = await app.request("/api/sync/devices", {
      headers: { Authorization: `Bearer ${credentialAB}` },
    });
    const body = await res.json();
    expect(body.count).toBe(2);
  });

  it("returns 1 right after initiate (before any join)", async () => {
    await initiate(DEVICE_A);
    const credential = credentialOf(DEVICE_A);

    const res = await app.request("/api/sync/devices", {
      headers: { Authorization: `Bearer ${credential}` },
    });
    const body = await res.json();
    expect(body.count).toBe(1);
  });

  it("returns 3 after a third device joins the same group", async () => {
    const { credential: credentialAB } = await pair(DEVICE_A, DEVICE_B);
    const code = await initiate(DEVICE_A);
    const joinRes = await join(DEVICE_C, code);
    expect(joinRes.status).toBe(200);

    const res = await app.request("/api/sync/devices", {
      headers: { Authorization: `Bearer ${credentialAB}` },
    });
    const body = await res.json();
    expect(body.count).toBe(3);
  });
});

describe("DELETE /api/sync/device", () => {
  it("returns 401 without Authorization", async () => {
    const res = await app.request("/api/sync/device", { method: "DELETE" });
    expect(res.status).toBe(401);
  });

  it("removes the calling device and lets it pair into another group afterwards", async () => {
    const { credential: credentialB } = await pair(DEVICE_A, DEVICE_B);

    const del = await app.request("/api/sync/device", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${credentialB}` },
    });
    expect(del.status).toBe(200);

    const remaining = await db
      .select()
      .from(devices)
      .where(eq(devices.id, DEVICE_B));
    expect(remaining).toHaveLength(0);

    const cursors = await db
      .select()
      .from(syncCursors)
      .where(eq(syncCursors.deviceId, DEVICE_B));
    expect(cursors).toHaveLength(0);

    const code = await initiate(DEVICE_C);
    const rejoin = await join(DEVICE_B, code);
    expect(rejoin.status).toBe(200);
  });

  it("keeps the sync group when other devices remain", async () => {
    const { credential: credentialB, syncGroupId } = await pair(
      DEVICE_A,
      DEVICE_B,
    );

    await app.request("/api/sync/device", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${credentialB}` },
    });

    const groups = await db
      .select()
      .from(syncGroups)
      .where(eq(syncGroups.id, syncGroupId));
    expect(groups).toHaveLength(1);

    const remaining = await db
      .select()
      .from(devices)
      .where(eq(devices.syncGroupId, syncGroupId));
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(DEVICE_A);
  });

  it("deletes the sync group when last device leaves", async () => {
    await initiate(DEVICE_A);
    const credentialA = credentialOf(DEVICE_A);

    const del = await app.request("/api/sync/device", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${credentialA}` },
    });
    expect(del.status).toBe(200);

    const groups = await db.select().from(syncGroups);
    expect(groups).toHaveLength(0);
  });
});
