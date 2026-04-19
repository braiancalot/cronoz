import { describe, it, expect, beforeEach } from "vitest";
import db from "@/services/db.js";
import deviceService from "@/services/deviceService.js";

beforeEach(async () => {
  await db.settings.clear();
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

  it("persists the deviceId to the settings store", async () => {
    const id = await deviceService.getOrCreateDeviceId();
    const entry = await db.settings.get("deviceId");
    expect(entry.value).toBe(id);
  });
});
