import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import app from "../../app.js";
import { db } from "../../db/index.js";
import { devices } from "../../db/schema.js";
import {
  CREDENTIAL_A,
  CREDENTIAL_B,
  CREDENTIAL_C,
  DEVICE_A,
  DEVICE_B,
  LEGACY_TOKEN,
  SECRET_A,
  SECRET_B,
  credentialOf,
  initiateWith,
  pairWith,
  post,
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

function request({ method, path, body }, credential) {
  return app.request(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${credential}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function errorOf(res) {
  return (await res.json()).error;
}

describe("authMiddleware", () => {
  it.each(AUTHED_ROUTES)(
    "returns 401 on $method $path for a deleted device",
    async (route) => {
      await pairWith(CREDENTIAL_A, CREDENTIAL_B);
      await db.delete(devices).where(eq(devices.id, DEVICE_B));

      const res = await request(route, CREDENTIAL_B);

      expect(res.status).toBe(401);
    },
  );

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
    expect(await errorOf(res)).toBe("invalid_device_credential");
  });

  it("returns 401 to a token from before device secrets", async () => {
    await pairWith(CREDENTIAL_A, CREDENTIAL_B);

    const res = await request(PULL, LEGACY_TOKEN);

    expect(res.status).toBe(401);
    expect(await errorOf(res)).toBe("missing_device_credential");
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
