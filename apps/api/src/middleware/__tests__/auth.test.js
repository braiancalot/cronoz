import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import app from "../../app.js";
import { db } from "../../db/index.js";
import { devices } from "../../db/schema.js";
import { hashDeviceSecret } from "../../lib/deviceSecret.js";
import { signToken } from "../../lib/jwt.js";
import {
  CREDENTIAL_A,
  CREDENTIAL_B,
  CREDENTIAL_C,
  DEVICE_A,
  DEVICE_B,
  DEVICE_C,
  SECRET_A,
  SECRET_B,
  credentialOf,
  initiateWith,
  pair,
  pairWith,
  post,
  tokenFor,
} from "../../../test/pairingFixtures.js";
import { makeProject } from "../../../test/projectFixtures.js";

const PULL = { method: "POST", path: "/api/sync/pull", body: { cursor: 0 } };
const PUSH = {
  method: "POST",
  path: "/api/sync/push",
  body: { projects: [], settings: [] },
};
const COUNT_DEVICES = { method: "GET", path: "/api/sync/devices" };
const LEAVE_GROUP = { method: "DELETE", path: "/api/sync/device" };
const AUTHED_ROUTES = [PULL, PUSH, COUNT_DEVICES, LEAVE_GROUP];

const B_WITH_ANOTHER_SECRET = credentialOf(DEVICE_B, SECRET_A);

function request({ method, path, body }, token) {
  return app.request(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function secretHashOf(deviceId) {
  const [device] = await db
    .select()
    .from(devices)
    .where(eq(devices.id, deviceId));
  return device.secretHash;
}

describe("authMiddleware", () => {
  it.each(AUTHED_ROUTES)(
    "returns 401 on $method $path for a deleted device",
    async (route) => {
      const { token } = await pair(DEVICE_A, DEVICE_B);
      await db.delete(devices).where(eq(devices.id, DEVICE_B));

      const res = await request(route, token);

      expect(res.status).toBe(401);
    },
  );

  it("returns 401 when the token's sync group is not the device's", async () => {
    await pair(DEVICE_A, DEVICE_B);
    const { syncGroupId: otherGroupId } = await pair(DEVICE_C, DEVICE_C);
    const forged = await signToken({
      deviceId: DEVICE_B,
      syncGroupId: otherGroupId,
    });

    const res = await request(PULL, forged);

    expect(res.status).toBe(401);
  });

  it("locks out a device that left while the rest of the group keeps syncing", async () => {
    const { token: tokenB } = await pair(DEVICE_A, DEVICE_B);
    const tokenA = await tokenFor(DEVICE_A);

    const left = await request(LEAVE_GROUP, tokenB);
    expect(left.status).toBe(200);

    const stale = await request(PULL, tokenB);
    const active = await request(PULL, tokenA);

    expect(stale.status).toBe(401);
    expect(active.status).toBe(200);
  });
});

describe("authMiddleware with a device credential", () => {
  it.each(AUTHED_ROUTES)(
    "accepts $method $path from a device that proves its secret",
    async (route) => {
      await pairWith(CREDENTIAL_A, CREDENTIAL_B);

      const res = await request(route, CREDENTIAL_B);

      expect(res.status).toBe(200);
    },
  );

  it.each(AUTHED_ROUTES)(
    "returns 401 on $method $path for another secret",
    async (route) => {
      await pairWith(CREDENTIAL_A, CREDENTIAL_B);

      const res = await request(route, B_WITH_ANOTHER_SECRET);

      expect(res.status).toBe(401);
    },
  );

  it("returns 401 for a device the server has never seen", async () => {
    const res = await request(PULL, CREDENTIAL_C);

    expect(res.status).toBe(401);
  });

  it("returns 401 for a deleted device", async () => {
    await pairWith(CREDENTIAL_A, CREDENTIAL_B);
    await db.delete(devices).where(eq(devices.id, DEVICE_B));

    const res = await request(PULL, CREDENTIAL_B);

    expect(res.status).toBe(401);
  });

  it("serves the device's own group and no other", async () => {
    await pairWith(CREDENTIAL_A, CREDENTIAL_B);
    await initiateWith(CREDENTIAL_C);
    const project = makeProject();
    await post(
      "/api/sync/push",
      { projects: [project], settings: [] },
      CREDENTIAL_B,
    );

    const partner = await post("/api/sync/pull", { cursor: 0 }, CREDENTIAL_A);
    const stranger = await post("/api/sync/pull", { cursor: 0 }, CREDENTIAL_C);

    expect((await partner.json()).projects).toEqual([project]);
    expect((await stranger.json()).projects).toEqual([]);
  });

  it("keeps a device that left locked out while its partner syncs", async () => {
    await pairWith(CREDENTIAL_A, CREDENTIAL_B);

    const left = await request(LEAVE_GROUP, CREDENTIAL_B);
    const stale = await request(PULL, CREDENTIAL_B);
    const active = await request(PULL, CREDENTIAL_A);

    expect(left.status).toBe(200);
    expect(stale.status).toBe(401);
    expect(active.status).toBe(200);
  });
});

describe("authMiddleware for a device paired before secrets existed", () => {
  it("adopts the first secret the device presents", async () => {
    await pair(DEVICE_A, DEVICE_B);

    const res = await request(PULL, CREDENTIAL_B);

    expect(res.status).toBe(200);
    expect(await secretHashOf(DEVICE_B)).toBe(hashDeviceSecret(SECRET_B));
  });

  it("refuses any other secret after adopting one", async () => {
    await pair(DEVICE_A, DEVICE_B);
    await request(PULL, CREDENTIAL_B);

    const res = await request(PULL, B_WITH_ANOTHER_SECRET);

    expect(res.status).toBe(401);
    expect(await secretHashOf(DEVICE_B)).toBe(hashDeviceSecret(SECRET_B));
  });

  it("refuses the device's old token once it has a secret", async () => {
    const { token } = await pair(DEVICE_A, DEVICE_B);
    await request(PULL, CREDENTIAL_B);

    const res = await request(PULL, token);

    expect(res.status).toBe(401);
  });

  it("keeps accepting the token of a partner that has no secret yet", async () => {
    await pair(DEVICE_A, DEVICE_B);
    const tokenA = await tokenFor(DEVICE_A);
    await request(PULL, CREDENTIAL_B);

    const res = await request(PULL, tokenA);

    expect(res.status).toBe(200);
    expect(await secretHashOf(DEVICE_A)).toBeNull();
  });
});

describe("a caller that only knows another device's id", () => {
  const FORGED = credentialOf(DEVICE_A, SECRET_B);

  it.each(AUTHED_ROUTES)("gets 401 on $method $path", async (route) => {
    await pairWith(CREDENTIAL_A, CREDENTIAL_B);

    const res = await request(route, FORGED);

    expect(res.status).toBe(401);
  });

  it("gets no token and no code, and the real device keeps working", async () => {
    await pairWith(CREDENTIAL_A, CREDENTIAL_B);

    const token = await post("/api/pair/token", { deviceId: DEVICE_A });
    const code = await post("/api/pair/initiate", {}, FORGED);
    const bareCode = await post("/api/pair/initiate", { deviceId: DEVICE_A });
    const real = await request(PULL, CREDENTIAL_A);

    expect(token.status).toBe(404);
    expect(code.status).toBe(401);
    expect(bareCode.status).toBe(401);
    expect(real.status).toBe(200);
  });
});
