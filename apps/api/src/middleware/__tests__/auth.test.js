import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import app from "../../app.js";
import { db } from "../../db/index.js";
import { devices } from "../../db/schema.js";
import { signToken } from "../../lib/jwt.js";
import {
  DEVICE_A,
  DEVICE_B,
  DEVICE_C,
  pair,
  tokenFor,
} from "../../../test/pairingFixtures.js";

const PULL = { method: "POST", path: "/api/sync/pull", body: { cursor: 0 } };
const PUSH = {
  method: "POST",
  path: "/api/sync/push",
  body: { projects: [], settings: [] },
};
const COUNT_DEVICES = { method: "GET", path: "/api/sync/devices" };
const LEAVE_GROUP = { method: "DELETE", path: "/api/sync/device" };
const AUTHED_ROUTES = [PULL, PUSH, COUNT_DEVICES, LEAVE_GROUP];

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
