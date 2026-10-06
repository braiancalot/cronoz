import { describe, it, expect } from "vitest";
import { resolveDatabaseUrl } from "../databaseTarget.js";

const PROD = { nodeEnv: "production" };
const DEV = { nodeEnv: "development" };

const REMOTE_URL =
  "postgresql://app:s3cr3t-pass@ep-example-pooler.neon.example/cronoz?sslmode=require";
const LOCAL_URL = "postgresql://cronoz:local-pass@localhost:5433/cronoz";

function failureOf(run) {
  try {
    run();
  } catch (err) {
    return err;
  }
  throw new Error("resolveDatabaseUrl should have thrown");
}

describe("resolveDatabaseUrl", () => {
  it("returns a remote URL unchanged in production", () => {
    expect(resolveDatabaseUrl(REMOTE_URL, PROD)).toBe(REMOTE_URL);
  });

  it("returns a local URL unchanged outside production", () => {
    expect(resolveDatabaseUrl(LOCAL_URL, DEV)).toBe(LOCAL_URL);
    expect(resolveDatabaseUrl(LOCAL_URL)).toBe(LOCAL_URL);
  });

  it.each([undefined, ""])("throws when the value is %j", (value) => {
    expect(() => resolveDatabaseUrl(value, DEV)).toThrow(
      /DATABASE_URL is not set; expected a Postgres URL/,
    );
  });

  it.each([
    ["localhost", LOCAL_URL],
    ["127.0.0.1", "postgresql://cronoz:local-pass@127.0.0.1:5433/cronoz"],
    ["[::1]", "postgresql://cronoz:local-pass@[::1]:5433/cronoz"],
    ["LOCALHOST", "postgresql://cronoz:local-pass@LOCALHOST:5433/cronoz"],
  ])("refuses the loopback host %s in production", (_host, url) => {
    const err = failureOf(() => resolveDatabaseUrl(url, PROD));

    expect(err.message).toMatch(/NODE_ENV=production/);
    expect(err.message).toMatch(/expected a remote Postgres host/);
  });

  it("names the host and keeps the password out of the message", () => {
    const err = failureOf(() => resolveDatabaseUrl(LOCAL_URL, PROD));

    expect(err.message).toContain('"localhost"');
    expect(err.message).not.toContain("local-pass");
  });

  it("refuses a value that is not a URL in production without echoing it", () => {
    const err = failureOf(() => resolveDatabaseUrl("local-pass@nowhere", PROD));

    expect(err.message).toMatch(/DATABASE_URL is not a URL/);
    expect(err.message).not.toContain("local-pass");
  });
});
