import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { devices, pairingCodes } from "../../db/schema.js";
import { hashDeviceSecret } from "../../lib/deviceSecret.js";
import {
  CREDENTIAL_A,
  CREDENTIAL_B,
  CREDENTIAL_C,
  DEVICE_A,
  DEVICE_B,
  SECRET_A,
  SECRET_B,
  credentialOf,
  initiate,
  initiateWith,
  post,
} from "../../../test/pairingFixtures.js";

const A_WITH_ANOTHER_SECRET = credentialOf(DEVICE_A, SECRET_B);

async function deviceRow(deviceId) {
  const [device] = await db
    .select()
    .from(devices)
    .where(eq(devices.id, deviceId));
  return device;
}

async function errorOf(res) {
  return (await res.json()).error;
}

describe("POST /api/pair/initiate with a device credential", () => {
  it("registers a new device keeping only the hash of its secret", async () => {
    const res = await post("/api/pair/initiate", {}, CREDENTIAL_A);

    expect(res.status).toBe(200);
    const device = await deviceRow(DEVICE_A);
    expect(device.secretHash).toBe(hashDeviceSecret(SECRET_A));
    expect(JSON.stringify(device)).not.toContain(SECRET_A);
  });

  it("issues another code to the device that proves its secret", async () => {
    const first = await initiateWith(CREDENTIAL_A);
    const second = await initiateWith(CREDENTIAL_A);

    expect(second).toBeTruthy();
    expect(second).not.toBe(first);
    expect(await db.select().from(devices)).toHaveLength(1);
  });

  it("answers 401 to another secret and keeps the device's code", async () => {
    const code = await initiateWith(CREDENTIAL_A);

    const res = await post("/api/pair/initiate", {}, A_WITH_ANOTHER_SECRET);

    expect(res.status).toBe(401);
    expect(await errorOf(res)).toBe("invalid_device_credential");
    const codes = await db.select().from(pairingCodes);
    expect(codes.map((row) => row.code)).toEqual([code]);
  });

  it("answers 401 to a bare device id once the device has a secret", async () => {
    await initiateWith(CREDENTIAL_A);

    const res = await post("/api/pair/initiate", { deviceId: DEVICE_A });

    expect(res.status).toBe(401);
    expect(await errorOf(res)).toBe("invalid_device_credential");
  });

  it("answers 401 when the caller names no device", async () => {
    const res = await post("/api/pair/initiate", {});

    expect(res.status).toBe(401);
    expect(await errorOf(res)).toBe("missing_device_credential");
  });
});

describe("POST /api/pair/join with a device credential", () => {
  it("joins the group and registers the joiner's secret", async () => {
    const code = await initiateWith(CREDENTIAL_A);

    const res = await post("/api/pair/join", { code }, CREDENTIAL_B);

    expect(res.status).toBe(200);
    const joiner = await deviceRow(DEVICE_B);
    expect(joiner.secretHash).toBe(hashDeviceSecret(SECRET_B));
    expect(joiner.syncGroupId).toBe((await deviceRow(DEVICE_A)).syncGroupId);
  });

  it("answers 401 to another device's id and leaves the code usable", async () => {
    await initiateWith(CREDENTIAL_A);
    const ownGroupId = (await deviceRow(DEVICE_A)).syncGroupId;
    const code = await initiateWith(CREDENTIAL_C);

    const forged = await post(
      "/api/pair/join",
      { code },
      A_WITH_ANOTHER_SECRET,
    );
    const honest = await post("/api/pair/join", { code }, CREDENTIAL_B);

    expect(forged.status).toBe(401);
    expect((await deviceRow(DEVICE_A)).syncGroupId).toBe(ownGroupId);
    expect(honest.status).toBe(200);
  });

  it("keeps the secret of a device that leaves its own unused group", async () => {
    await initiateWith(CREDENTIAL_A);
    const code = await initiateWith(CREDENTIAL_B);

    const res = await post("/api/pair/join", { code }, CREDENTIAL_A);

    expect(res.status).toBe(200);
    const moved = await deviceRow(DEVICE_A);
    expect(moved.secretHash).toBe(hashDeviceSecret(SECRET_A));
    expect(moved.syncGroupId).toBe((await deviceRow(DEVICE_B)).syncGroupId);
  });
});

describe("POST /api/pair/status with a device credential", () => {
  it("reports the code to the device that proves its secret", async () => {
    const code = await initiateWith(CREDENTIAL_A);

    const res = await post("/api/pair/status", { code }, CREDENTIAL_A);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "waiting" });
  });

  it("reports joined once the other device used the code", async () => {
    const code = await initiateWith(CREDENTIAL_A);
    await post("/api/pair/join", { code }, CREDENTIAL_B);

    const res = await post("/api/pair/status", { code }, CREDENTIAL_A);

    expect(await res.json()).toEqual({ status: "joined" });
  });

  it("answers 401 to another secret", async () => {
    const code = await initiateWith(CREDENTIAL_A);

    const res = await post("/api/pair/status", { code }, A_WITH_ANOTHER_SECRET);

    expect(res.status).toBe(401);
  });

  it("answers 401 to a bare device id once the device has a secret", async () => {
    const code = await initiateWith(CREDENTIAL_A);

    const res = await post("/api/pair/status", { deviceId: DEVICE_A, code });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/pair/token for a device with a secret", () => {
  it("answers 404, same as for an unknown device", async () => {
    await initiateWith(CREDENTIAL_A);

    const res = await post("/api/pair/token", { deviceId: DEVICE_A });

    expect(res.status).toBe(404);
    expect(await errorOf(res)).toBe("device_not_found");
  });
});

describe("pairing routes for a device paired before secrets existed", () => {
  it("adopts the first secret presented on /pair/status", async () => {
    const code = await initiate(DEVICE_A);

    const res = await post("/api/pair/status", { code }, CREDENTIAL_A);

    expect(res.status).toBe(200);
    expect((await deviceRow(DEVICE_A)).secretHash).toBe(
      hashDeviceSecret(SECRET_A),
    );
  });

  it("adopts the first secret presented on /pair/initiate", async () => {
    await initiate(DEVICE_A);

    const res = await post("/api/pair/initiate", {}, CREDENTIAL_A);

    expect(res.status).toBe(200);
    expect((await deviceRow(DEVICE_A)).secretHash).toBe(
      hashDeviceSecret(SECRET_A),
    );
  });

  it("refuses any other secret after adopting one", async () => {
    const code = await initiate(DEVICE_A);
    await post("/api/pair/status", { code }, CREDENTIAL_A);

    const res = await post("/api/pair/status", { code }, A_WITH_ANOTHER_SECRET);

    expect(res.status).toBe(401);
  });
});
