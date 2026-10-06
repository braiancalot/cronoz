import { describe, it, expect } from "vitest";
import { resolveAllowedOrigins } from "../corsOrigins.js";

const PROD = { nodeEnv: "production" };
const DEV = { nodeEnv: "development" };

describe("resolveAllowedOrigins", () => {
  it("splits a comma-separated list and trims each entry", () => {
    expect(
      resolveAllowedOrigins(
        "https://cronoz.example, http://localhost:5173",
        PROD,
      ),
    ).toEqual(["https://cronoz.example", "http://localhost:5173"]);
  });

  it("drops empty entries", () => {
    expect(resolveAllowedOrigins("https://a.example,,  ,", PROD)).toEqual([
      "https://a.example",
    ]);
  });

  it("falls back to the vite dev server outside production", () => {
    expect(resolveAllowedOrigins(undefined, DEV)).toEqual([
      "http://localhost:5173",
    ]);
    expect(resolveAllowedOrigins("   ", DEV)).toEqual([
      "http://localhost:5173",
    ]);
  });

  it("throws in production when the list is empty", () => {
    expect(() => resolveAllowedOrigins(undefined, PROD)).toThrow(
      /CORS_ALLOWED_ORIGINS/,
    );
  });

  it("rejects a trailing slash, naming the bare origin", () => {
    expect(() =>
      resolveAllowedOrigins("https://cronoz.example/", PROD),
    ).toThrow(/expected "https:\/\/cronoz\.example"/);
  });

  it("rejects an entry carrying a path", () => {
    expect(() =>
      resolveAllowedOrigins("https://cronoz.example/api", PROD),
    ).toThrow(/not a bare origin/);
  });

  it("rejects an entry that is not a URL", () => {
    expect(() => resolveAllowedOrigins("cronoz.example", PROD)).toThrow(
      /invalid entry "cronoz.example"/,
    );
  });
});
