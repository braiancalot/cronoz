import { describe, it, expect, beforeEach } from "vitest";
import {
  DEVICE_SECRET_KEY,
  formatDeviceCredential,
  parseDeviceCredential,
} from "@cronoz/shared";
import db from "@/services/db.js";
import deviceService from "@/services/deviceService.js";

beforeEach(async () => {
  await db.internal.clear();
});

describe("getOrCreateDeviceId", () => {
  it("generates a new deviceId when none exists", async () => {
    const id = await deviceService.getOrCreateDeviceId();
    expect(id).toBeTypeOf("string");
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("returns the same deviceId on subsequent calls", async () => {
    const first = await deviceService.getOrCreateDeviceId();
    const second = await deviceService.getOrCreateDeviceId();
    expect(second).toBe(first);
  });

  it("persists the deviceId to the internal store", async () => {
    const id = await deviceService.getOrCreateDeviceId();
    const entry = await db.internal.get("deviceId");
    expect(entry.value).toBe(id);
  });
});

describe("getDeviceCredential", () => {
  it("joins the device id and a stored secret", async () => {
    const credential = await deviceService.getDeviceCredential();

    const deviceId = await deviceService.getOrCreateDeviceId();
    const { value: secret } = await db.internal.get(DEVICE_SECRET_KEY);
    expect(credential).toBe(formatDeviceCredential({ deviceId, secret }));
    expect(parseDeviceCredential(credential)).toEqual({ deviceId, secret });
  });

  it("keeps the id of a device that existed before it had a secret", async () => {
    const deviceId = await deviceService.getOrCreateDeviceId();

    const credential = await deviceService.getDeviceCredential();

    expect(parseDeviceCredential(credential).deviceId).toBe(deviceId);
  });

  it("returns the same credential on subsequent calls", async () => {
    const first = await deviceService.getDeviceCredential();
    const second = await deviceService.getDeviceCredential();

    expect(second).toBe(first);
  });

  // Two secrets would lock the device out: the server keeps the first one it
  // sees and refuses the other for good.
  it("gives racing callers the same credential", async () => {
    const credentials = await Promise.all([
      deviceService.getDeviceCredential(),
      deviceService.getDeviceCredential(),
      deviceService.getDeviceCredential(),
    ]);

    expect(new Set(credentials).size).toBe(1);
  });
});
