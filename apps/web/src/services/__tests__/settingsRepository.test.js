import { describe, it, expect, beforeEach } from "vitest";
import db from "@/services/db.js";
import settingsRepository from "@/services/settingsRepository.js";

beforeEach(async () => {
  await db.settings.clear();
});

describe("get", () => {
  it("returns default value for hourlyPrice", async () => {
    const value = await settingsRepository.get("hourlyPrice");
    expect(value).toBe(10);
  });

  it("returns null for unknown key without default", async () => {
    const value = await settingsRepository.get("unknownKey");
    expect(value).toBeNull();
  });

  it("returns false as default for ignoreMilliseconds", async () => {
    const value = await settingsRepository.get("ignoreMilliseconds");
    expect(value).toBe(false);
  });
});

describe("getResolved", () => {
  it("returns all defaults when nothing is stored", async () => {
    const resolved = await settingsRepository.getResolved();
    expect(resolved).toEqual({ hourlyPrice: 10, ignoreMilliseconds: false });
  });

  it("returns stored values merged over defaults", async () => {
    await settingsRepository.set("ignoreMilliseconds", true);
    const resolved = await settingsRepository.getResolved();
    expect(resolved).toEqual({ hourlyPrice: 10, ignoreMilliseconds: true });
  });

  it("preserves a stored falsy value instead of the default", async () => {
    await settingsRepository.set("hourlyPrice", 0);
    const resolved = await settingsRepository.getResolved();
    expect(resolved.hourlyPrice).toBe(0);
  });
});

describe("set", () => {
  it("stores and retrieves a value", async () => {
    await settingsRepository.set("hourlyPrice", 50);
    const value = await settingsRepository.get("hourlyPrice");
    expect(value).toBe(50);
  });

  it("overwrites a previously set value", async () => {
    await settingsRepository.set("hourlyPrice", 50);
    await settingsRepository.set("hourlyPrice", 100);
    const value = await settingsRepository.get("hourlyPrice");
    expect(value).toBe(100);
  });

  it("stores updatedAt timestamp", async () => {
    await settingsRepository.set("hourlyPrice", 50);
    const entry = await db.settings.get("hourlyPrice");
    expect(entry.updatedAt).toBeTypeOf("number");
  });
});
