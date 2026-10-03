import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { PAIRING_CODE_ALPHABET } from "@cronoz/shared";
import { db } from "../../db/index.js";
import { pairingCodes, devices, syncGroups } from "../../db/schema.js";
import { verifyToken } from "../../lib/jwt.js";
import {
  DEVICE_A,
  DEVICE_B,
  DEVICE_C,
  DEVICE_D,
  initiate,
  post,
} from "../../../test/pairingFixtures.js";

describe("POST /api/pair/initiate", () => {
  it("creates sync_group, device, and pairing code for a new device", async () => {
    const res = await post("/api/pair/initiate", { deviceId: DEVICE_A });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.code).toMatch(new RegExp(`^[${PAIRING_CODE_ALPHABET}]{8}$`));
    expect(body.expiresAt).toBeTruthy();

    const groups = await db.select().from(syncGroups);
    expect(groups).toHaveLength(1);

    const [device] = await db
      .select()
      .from(devices)
      .where(eq(devices.id, DEVICE_A));
    expect(device.syncGroupId).toBe(groups[0].id);

    const codes = await db.select().from(pairingCodes);
    expect(codes).toHaveLength(1);
    expect(codes[0].code).toBe(body.code);
  });

  it("reuses existing sync_group when device already exists", async () => {
    await initiate(DEVICE_A);
    await initiate(DEVICE_A);

    const groups = await db.select().from(syncGroups);
    expect(groups).toHaveLength(1);
    const devicesRows = await db.select().from(devices);
    expect(devicesRows).toHaveLength(1);
  });

  it("invalidates previous pending codes for the same device", async () => {
    const firstCode = await initiate(DEVICE_A);
    const secondCode = await initiate(DEVICE_A);

    expect(firstCode).not.toBe(secondCode);
    const codes = await db.select().from(pairingCodes);
    expect(codes).toHaveLength(1);
    expect(codes[0].code).toBe(secondCode);
  });

  it("returns 400 for invalid deviceId", async () => {
    const res = await post("/api/pair/initiate", { deviceId: "not-a-uuid" });
    expect(res.status).toBe(400);
  });

  it("allows a paired device to invite a third one without creating a new sync_group", async () => {
    const code1 = await initiate(DEVICE_A);
    await post("/api/pair/join", { deviceId: DEVICE_B, code: code1 });

    const code2 = await initiate(DEVICE_A);
    const res = await post("/api/pair/join", {
      deviceId: DEVICE_C,
      code: code2,
    });
    expect(res.status).toBe(200);

    const groups = await db.select().from(syncGroups);
    expect(groups).toHaveLength(1);

    const rows = await db.select().from(devices);
    expect(rows).toHaveLength(3);
    const groupIds = new Set(rows.map((d) => d.syncGroupId));
    expect(groupIds.size).toBe(1);
  });
});

describe("POST /api/pair/join", () => {
  it("joins device B to device A's group and returns a valid JWT", async () => {
    const code = await initiate(DEVICE_A);

    const res = await post("/api/pair/join", { deviceId: DEVICE_B, code });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBeTruthy();
    expect(body.syncGroupId).toBeTruthy();

    const payload = await verifyToken(body.token);
    expect(payload.deviceId).toBe(DEVICE_B);
    expect(payload.syncGroupId).toBe(body.syncGroupId);

    const [deviceB] = await db
      .select()
      .from(devices)
      .where(eq(devices.id, DEVICE_B));
    expect(deviceB.syncGroupId).toBe(body.syncGroupId);
  });

  it("returns 400 for non-existent code", async () => {
    const res = await post("/api/pair/join", {
      deviceId: DEVICE_B,
      code: "22222222",
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when code has already been used", async () => {
    const code = await initiate(DEVICE_A);
    await post("/api/pair/join", { deviceId: DEVICE_B, code });

    const res = await post("/api/pair/join", { deviceId: DEVICE_C, code });
    expect(res.status).toBe(400);
  });

  it("returns 400 when code is expired", async () => {
    const code = await initiate(DEVICE_A);
    await db
      .update(pairingCodes)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(pairingCodes.code, code));

    const res = await post("/api/pair/join", { deviceId: DEVICE_B, code });
    expect(res.status).toBe(400);
  });

  it("returns 409 when device already belongs to a different group", async () => {
    const code1 = await initiate(DEVICE_A);
    await post("/api/pair/join", { deviceId: DEVICE_B, code: code1 });

    const code2 = await initiate(DEVICE_C);
    const res = await post("/api/pair/join", {
      deviceId: DEVICE_B,
      code: code2,
    });
    expect(res.status).toBe(409);
  });

  it("is idempotent when device rejoins its own group", async () => {
    const code = await initiate(DEVICE_A);
    await post("/api/pair/join", { deviceId: DEVICE_B, code });

    const code2 = await initiate(DEVICE_A);
    const res = await post("/api/pair/join", {
      deviceId: DEVICE_B,
      code: code2,
    });
    expect(res.status).toBe(200);
  });
});

describe("POST /api/pair/join failed-attempt brake", () => {
  function join(deviceId, code) {
    return post("/api/pair/join", { deviceId, code });
  }

  function codeOutside(liveCodes) {
    return ["22222222", "33333333", "44444444"].find(
      (candidate) => !liveCodes.includes(candidate),
    );
  }

  async function failJoins(liveCodes, times) {
    const wrongCode = codeOutside(liveCodes);
    for (let i = 0; i < times; i++) await join(DEVICE_B, wrongCode);
  }

  it("still accepts a live code after 4 failed joins", async () => {
    const code = await initiate(DEVICE_A);
    await failJoins([code], 4);

    const res = await join(DEVICE_B, code);
    expect(res.status).toBe(200);
  });

  it("burns every live code after 5 failed joins", async () => {
    const codeA = await initiate(DEVICE_A);
    const codeC = await initiate(DEVICE_C);
    await failJoins([codeA, codeC], 5);

    expect((await join(DEVICE_B, codeA)).status).toBe(400);
    expect((await join(DEVICE_D, codeC)).status).toBe(400);
  });

  it("gives a code generated after the brake a clean slate", async () => {
    const burned = await initiate(DEVICE_A);
    await failJoins([burned], 5);

    const fresh = await initiate(DEVICE_A);
    const res = await join(DEVICE_B, fresh);
    expect(res.status).toBe(200);
  });

  it("does not count malformed codes rejected by validation", async () => {
    const code = await initiate(DEVICE_A);
    for (let i = 0; i < 5; i++) await join(DEVICE_B, "0000OOOO");

    const res = await join(DEVICE_B, code);
    expect(res.status).toBe(200);
  });
});

describe("POST /api/pair/token", () => {
  it("returns a valid token for an existing device", async () => {
    const code = await initiate(DEVICE_A);
    await post("/api/pair/join", { deviceId: DEVICE_B, code });

    const res = await post("/api/pair/token", { deviceId: DEVICE_B });
    expect(res.status).toBe(200);
    const body = await res.json();
    const payload = await verifyToken(body.token);
    expect(payload.deviceId).toBe(DEVICE_B);
    expect(payload.syncGroupId).toBe(body.syncGroupId);
  });

  it("returns 404 for non-existent device", async () => {
    const res = await post("/api/pair/token", { deviceId: DEVICE_A });
    expect(res.status).toBe(404);
  });
});
