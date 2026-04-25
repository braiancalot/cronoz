import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let syncService;
let SyncError;
let fetchMock;

function mockResponse({ ok = true, status = 200, body = null } = {}) {
  const text = body == null ? "" : JSON.stringify(body);
  return {
    ok,
    status,
    text: () => Promise.resolve(text),
  };
}

function getRequestArgs(callIndex = 0) {
  const [url, init] = fetchMock.mock.calls[callIndex];
  return { url, init, body: init.body ? JSON.parse(init.body) : undefined };
}

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv("VITE_API_URL", "http://api.test");
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  ({ default: syncService, SyncError } =
    await import("@/services/syncService.js"));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("syncService.pairInitiate", () => {
  it("POSTs deviceId to /api/pair/initiate without auth", async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ body: { code: "123456", expiresAt: "2026-01-01" } }),
    );

    const res = await syncService.pairInitiate({ deviceId: "dev-1" });

    expect(res).toEqual({ code: "123456", expiresAt: "2026-01-01" });
    const { url, init, body } = getRequestArgs();
    expect(url).toBe("http://api.test/api/pair/initiate");
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers.Authorization).toBeUndefined();
    expect(body).toEqual({ deviceId: "dev-1" });
  });
});

describe("syncService.pairJoin", () => {
  it("POSTs deviceId+code to /api/pair/join", async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ body: { token: "tok", syncGroupId: "g-1" } }),
    );

    const res = await syncService.pairJoin({ deviceId: "dev-1", code: "999" });

    expect(res).toEqual({ token: "tok", syncGroupId: "g-1" });
    const { url, body } = getRequestArgs();
    expect(url).toBe("http://api.test/api/pair/join");
    expect(body).toEqual({ deviceId: "dev-1", code: "999" });
  });
});

describe("syncService.refreshToken", () => {
  it("POSTs deviceId to /api/pair/token", async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ body: { token: "tok2", syncGroupId: "g-1" } }),
    );

    const res = await syncService.refreshToken({ deviceId: "dev-1" });

    expect(res).toEqual({ token: "tok2", syncGroupId: "g-1" });
    const { url, body } = getRequestArgs();
    expect(url).toBe("http://api.test/api/pair/token");
    expect(body).toEqual({ deviceId: "dev-1" });
  });
});

describe("syncService.push", () => {
  it("POSTs projects+settings to /api/sync/push with bearer token", async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ body: { ok: true, serverTimestamp: 123 } }),
    );

    const res = await syncService.push({
      token: "tok",
      projects: [{ id: "p1" }],
      settings: [{ key: "hourlyPrice", value: 10 }],
    });

    expect(res).toEqual({ ok: true, serverTimestamp: 123 });
    const { url, init, body } = getRequestArgs();
    expect(url).toBe("http://api.test/api/sync/push");
    expect(init.headers.Authorization).toBe("Bearer tok");
    expect(body).toEqual({
      projects: [{ id: "p1" }],
      settings: [{ key: "hourlyPrice", value: 10 }],
    });
  });
});

describe("syncService.pull", () => {
  it("POSTs cursor to /api/sync/pull with bearer token", async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ body: { projects: [], settings: [], cursor: 42 } }),
    );

    const res = await syncService.pull({ token: "tok", cursor: 7 });

    expect(res).toEqual({ projects: [], settings: [], cursor: 42 });
    const { url, init, body } = getRequestArgs();
    expect(url).toBe("http://api.test/api/sync/pull");
    expect(init.headers.Authorization).toBe("Bearer tok");
    expect(body).toEqual({ cursor: 7 });
  });
});

describe("syncService error handling", () => {
  it("throws SyncError with status and body on 4xx", async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ ok: false, status: 400, body: { error: "bad" } }),
    );

    const err = await syncService
      .pairJoin({ deviceId: "d", code: "x" })
      .catch((e) => e);

    expect(err).toBeInstanceOf(SyncError);
    expect(err.status).toBe(400);
    expect(err.body).toEqual({ error: "bad" });
    expect(err.message).toBe("http_400");
  });

  it("throws SyncError with status 401 on auth failure", async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ ok: false, status: 401, body: { error: "unauthorized" } }),
    );

    const err = await syncService
      .pull({ token: "bad", cursor: 0 })
      .catch((e) => e);

    expect(err).toBeInstanceOf(SyncError);
    expect(err.status).toBe(401);
  });

  it("throws SyncError(network_error) when fetch rejects", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const err = await syncService
      .pairInitiate({ deviceId: "d" })
      .catch((e) => e);

    expect(err).toBeInstanceOf(SyncError);
    expect(err.status).toBeUndefined();
    expect(err.message).toBe("network_error");
    expect(err.body).toBe("Failed to fetch");
  });

  it("handles empty response body without crashing", async () => {
    fetchMock.mockResolvedValue(mockResponse({ body: null }));

    const res = await syncService.pairInitiate({ deviceId: "d" });
    expect(res).toBeNull();
  });

  it("throws clear error if VITE_API_URL is not configured", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_API_URL", "");
    const { default: svc, SyncError: SE } =
      await import("@/services/syncService.js");

    const err = await svc.pairInitiate({ deviceId: "d" }).catch((e) => e);
    expect(err).toBeInstanceOf(SE);
    expect(err.message).toMatch(/VITE_API_URL/);
  });
});
