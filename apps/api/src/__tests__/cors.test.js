import { describe, it, expect } from "vitest";
import app from "../app.js";

const ORIGIN = "http://localhost:5173";
const UNKNOWN_ORIGIN = "https://evil.example";

const registeredRoutes = (() => {
  const seen = new Set();
  return app.routes
    .filter((r) => r.method !== "ALL" && !r.path.includes("*"))
    .filter(({ method, path }) => {
      const key = `${method} ${path}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
})();

function preflight(path, method) {
  return app.request(path.replace(/:\w+/g, "x"), {
    method: "OPTIONS",
    headers: {
      Origin: ORIGIN,
      "Access-Control-Request-Method": method,
      "Access-Control-Request-Headers": "content-type",
    },
  });
}

describe("CORS preflight", () => {
  it("has at least one registered route to validate", () => {
    expect(registeredRoutes.length).toBeGreaterThan(0);
  });

  it.each(registeredRoutes)(
    "allows $method on $path",
    async ({ method, path }) => {
      const response = await preflight(path, method);
      expect(response.status).toBe(204);
      const allowed = (
        response.headers.get("access-control-allow-methods") ?? ""
      )
        .split(",")
        .map((m) => m.trim().toUpperCase());
      expect(allowed).toContain(method);
    },
  );

  it("does not advertise PATCH (a method no route uses and not in allowMethods)", async () => {
    const response = await preflight("/api/sync/device", "PATCH");
    const allowed = (response.headers.get("access-control-allow-methods") ?? "")
      .split(",")
      .map((m) => m.trim().toUpperCase());
    expect(allowed).not.toContain("PATCH");
  });
});

describe("CORS allowlist", () => {
  it("echoes an allowed origin on preflight", async () => {
    const response = await preflight("/api/health", "GET");
    expect(response.headers.get("access-control-allow-origin")).toBe(ORIGIN);
  });

  it("omits the allow-origin header on preflight from an unknown origin", async () => {
    const response = await app.request("/api/health", {
      method: "OPTIONS",
      headers: {
        Origin: UNKNOWN_ORIGIN,
        "Access-Control-Request-Method": "GET",
      },
    });
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("omits the allow-origin header on a simple request from an unknown origin", async () => {
    const response = await app.request("/api/health", {
      headers: { Origin: UNKNOWN_ORIGIN },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });
});
