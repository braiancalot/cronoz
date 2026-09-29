import { describe, it, expect } from "vitest";
import { assertUsableSecret } from "../jwtSecret.js";

const STRONG = "k3Jq8vZpL2nR7tYwX4bM9cF6hD1sG0aE";

describe("assertUsableSecret", () => {
  it("returns the secret when it is usable", () => {
    expect(assertUsableSecret(STRONG, { nodeEnv: "production" })).toBe(STRONG);
  });

  it("rejects a missing secret", () => {
    expect(() =>
      assertUsableSecret(undefined, { nodeEnv: "production" }),
    ).toThrow(/not set/);
    expect(() => assertUsableSecret("", { nodeEnv: "development" })).toThrow(
      /not set/,
    );
  });

  it.each(["dev-secret-change-me", "test-secret", "changeme"])(
    "rejects the public placeholder %s in any environment",
    (placeholder) => {
      expect(() =>
        assertUsableSecret(placeholder, { nodeEnv: "development" }),
      ).toThrow(placeholder);
    },
  );

  it("rejects a short secret in production, reporting the length", () => {
    expect(() =>
      assertUsableSecret("tooshort", { nodeEnv: "production" }),
    ).toThrow(/8 characters.*at least 32/);
  });

  it("allows a short secret outside production", () => {
    expect(assertUsableSecret("tooshort", { nodeEnv: "development" })).toBe(
      "tooshort",
    );
  });

  it("never echoes the rejected secret in the length error", () => {
    const secret = "s3cr3t-but-far-too-short";
    expect(() => assertUsableSecret(secret, { nodeEnv: "production" })).toThrow(
      expect.not.stringContaining(secret),
    );
  });
});
