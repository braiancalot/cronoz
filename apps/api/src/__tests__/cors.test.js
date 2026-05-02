import { describe, it, expect } from "vitest";
import app from "../app.js";

const ORIGIN = "https://cronoz.app";

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
      const res = await preflight(path, method);
      expect(res.status).toBe(204);
      const allowed = (res.headers.get("access-control-allow-methods") ?? "")
        .split(",")
        .map((m) => m.trim().toUpperCase());
      expect(allowed).toContain(method);
    },
  );

  it("does not advertise PATCH (a method no route uses and not in allowMethods)", async () => {
    const res = await preflight("/api/sync/device", "PATCH");
    const allowed = (res.headers.get("access-control-allow-methods") ?? "")
      .split(",")
      .map((m) => m.trim().toUpperCase());
    expect(allowed).not.toContain("PATCH");
  });
});
