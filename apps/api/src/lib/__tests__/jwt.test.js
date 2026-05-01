import { describe, it, expect } from "vitest";
import { signToken, verifyToken } from "../jwt.js";

const DEVICE_ID = "11111111-1111-1111-1111-111111111111";
const SYNC_GROUP_ID = "22222222-2222-2222-2222-222222222222";

describe("jwt", () => {
  it("signs and verifies a token preserving payload", async () => {
    const token = await signToken({
      deviceId: DEVICE_ID,
      syncGroupId: SYNC_GROUP_ID,
    });
    const payload = await verifyToken(token);
    expect(payload.deviceId).toBe(DEVICE_ID);
    expect(payload.syncGroupId).toBe(SYNC_GROUP_ID);
    expect(typeof payload.iat).toBe("number");
    expect(typeof payload.exp).toBe("number");
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });

  it("rejects invalid tokens", async () => {
    await expect(verifyToken("not-a-token")).rejects.toThrow();
  });

  it("rejects tampered tokens", async () => {
    const token = await signToken({
      deviceId: DEVICE_ID,
      syncGroupId: SYNC_GROUP_ID,
    });
    const tampered = token.slice(0, -5) + "xxxxx";
    await expect(verifyToken(tampered)).rejects.toThrow();
  });
});
