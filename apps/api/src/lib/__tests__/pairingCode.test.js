import { describe, it, expect } from "vitest";
import { PAIRING_CODE_TTL_MS } from "@cronoz/shared";
import { generateCode, computeExpiresAt, isExpired } from "../pairingCode.js";

describe("generateCode", () => {
  it("returns a 6-digit numeric string", () => {
    const code = generateCode();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^\d{6}$/);
  });

  it("produces different values across calls", () => {
    const codes = new Set();
    for (let i = 0; i < 50; i++) codes.add(generateCode());
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe("computeExpiresAt", () => {
  it("returns now + TTL", () => {
    const now = Date.now();
    const expires = computeExpiresAt(now);
    expect(expires.getTime()).toBe(now + PAIRING_CODE_TTL_MS);
  });
});

describe("isExpired", () => {
  it("returns true for past dates", () => {
    expect(isExpired(new Date(Date.now() - 1000))).toBe(true);
  });

  it("returns false for future dates", () => {
    expect(isExpired(new Date(Date.now() + 60_000))).toBe(false);
  });
});
