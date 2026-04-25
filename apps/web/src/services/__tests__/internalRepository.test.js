import { describe, it, expect, beforeEach } from "vitest";
import db from "@/services/db.js";
import internalRepository from "@/services/internalRepository.js";

beforeEach(async () => {
  await db.internal.clear();
});

describe("internalRepository", () => {
  it("returns undefined for a missing key", async () => {
    expect(await internalRepository.get("missing")).toBeUndefined();
  });

  it("persists and reads back a value", async () => {
    await internalRepository.set("token", "abc123");
    expect(await internalRepository.get("token")).toBe("abc123");
  });

  it("supports non-string values", async () => {
    await internalRepository.set("cursor", 42);
    expect(await internalRepository.get("cursor")).toBe(42);

    await internalRepository.set("blob", { a: 1 });
    expect(await internalRepository.get("blob")).toEqual({ a: 1 });
  });

  it("overwrites an existing value", async () => {
    await internalRepository.set("k", "v1");
    await internalRepository.set("k", "v2");
    expect(await internalRepository.get("k")).toBe("v2");
  });

  it("removes a key", async () => {
    await internalRepository.set("k", "v");
    await internalRepository.remove("k");
    expect(await internalRepository.get("k")).toBeUndefined();
  });

  it("remove is idempotent on missing key", async () => {
    await expect(internalRepository.remove("nope")).resolves.toBeUndefined();
  });
});
