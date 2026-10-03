import { describe, it, expect } from "vitest";
import { PAIRING_CODE_ALPHABET, PAIRING_CODE_TTL_MS } from "@cronoz/shared";
import {
  PAIRING_CODE_MAX_FAILED_JOINS,
  computeExpiresAt,
  generateCode,
  isExpired,
  pairingStatusOf,
} from "../pairingCode.js";

class FakeRandomSource {
  constructor(bytes) {
    this.bytes = [...bytes];
  }

  fill = (array) => {
    for (let i = 0; i < array.length; i++) array[i] = this.bytes.shift() ?? 0;
    return array;
  };
}

describe("generateCode", () => {
  it("returns 8 characters from the unambiguous alphabet", () => {
    const code = generateCode();
    expect(code).toMatch(new RegExp(`^[${PAIRING_CODE_ALPHABET}]{8}$`));
  });

  it("maps each random byte onto the alphabet", () => {
    const random = new FakeRandomSource([0, 1, 29, 30, 31, 59, 60, 239]);
    expect(generateCode(random.fill)).toBe("23Z23Z2Z");
  });

  it("discards bytes past the last full alphabet cycle to avoid bias", () => {
    const random = new FakeRandomSource([240, 255, 1, 1, 1, 1, 1, 1, 1, 1]);
    expect(generateCode(random.fill)).toBe("33333333");
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

describe("pairingStatusOf", () => {
  const live = {
    usedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
    failedJoins: 0,
  };

  it("treats a missing code as expired", () => {
    expect(pairingStatusOf(undefined)).toBe("expired");
  });

  it("puts joined ahead of expiry, so a late poll still sees the join", () => {
    const usedThenExpired = {
      ...live,
      usedAt: new Date(),
      expiresAt: new Date(Date.now() - 1000),
    };
    expect(pairingStatusOf(usedThenExpired)).toBe("joined");
  });

  it("reports burned at the failed-join limit", () => {
    const burned = { ...live, failedJoins: PAIRING_CODE_MAX_FAILED_JOINS };
    expect(pairingStatusOf(burned)).toBe("burned");
  });

  it("reports waiting for a live code", () => {
    expect(pairingStatusOf(live)).toBe("waiting");
  });
});
