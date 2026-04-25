import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  LAST_PUSHED_AT_KEY,
  SYNC_CURSOR_KEY,
  SYNC_TOKEN_KEY,
} from "@cronoz/shared";

vi.mock("@/services/syncService.js", async () => {
  const actual = await vi.importActual("@/services/syncService.js");
  return {
    ...actual,
    default: {
      pairInitiate: vi.fn(),
      pairJoin: vi.fn(),
      refreshToken: vi.fn(),
      push: vi.fn(),
      pull: vi.fn(),
    },
  };
});

import db from "@/services/db.js";
import internalRepository from "@/services/internalRepository.js";
import projectRepository from "@/services/projectRepository.js";
import syncService, { SyncError } from "@/services/syncService.js";
import syncManager from "@/services/syncManager.js";

beforeEach(async () => {
  await db.internal.clear();
  await db.projects.clear();
  await db.settings.clear();
  vi.clearAllMocks();
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("syncManager.isPaired", () => {
  it("returns false when no token is stored", async () => {
    expect(await syncManager.isPaired()).toBe(false);
  });

  it("returns true when a token is stored", async () => {
    await internalRepository.set(SYNC_TOKEN_KEY, "tok");
    expect(await syncManager.isPaired()).toBe(true);
  });
});

describe("syncManager.sync — not paired", () => {
  it("returns without calling syncService when no token", async () => {
    await syncManager.sync();
    expect(syncService.push).not.toHaveBeenCalled();
    expect(syncService.pull).not.toHaveBeenCalled();
  });
});

describe("syncManager.sync — paired", () => {
  beforeEach(async () => {
    await internalRepository.set(SYNC_TOKEN_KEY, "tok");
    syncService.pull.mockResolvedValue({
      projects: [],
      settings: [],
      cursor: 0,
    });
  });

  it("only pulls when there are no local changes", async () => {
    await syncManager.sync();
    expect(syncService.push).not.toHaveBeenCalled();
    expect(syncService.pull).toHaveBeenCalledWith({ token: "tok", cursor: 0 });
  });

  it("pushes local changes newer than lastPushedAt, then pulls", async () => {
    await internalRepository.set(LAST_PUSHED_AT_KEY, 100);
    await projectRepository.save({ id: "p1", updatedAt: 50, data: "old" });
    await projectRepository.save({ id: "p2", updatedAt: 200, data: "new" });
    await db.settings.put({ key: "hourlyPrice", value: 10, updatedAt: 300 });
    await db.settings.put({ key: "stale", value: 1, updatedAt: 50 });

    syncService.push.mockResolvedValue({ ok: true, serverTimestamp: 999 });

    await syncManager.sync();

    expect(syncService.push).toHaveBeenCalledTimes(1);
    const pushArg = syncService.push.mock.calls[0][0];
    expect(pushArg.token).toBe("tok");
    expect(pushArg.projects.map((p) => p.id)).toEqual(["p2"]);
    expect(pushArg.settings.map((s) => s.key)).toEqual(["hourlyPrice"]);

    expect(await internalRepository.get(LAST_PUSHED_AT_KEY)).toBe(999);
    expect(syncService.pull).toHaveBeenCalled();
  });

  it("applies pulled records that are newer than local", async () => {
    await projectRepository.save({ id: "p1", updatedAt: 100, name: "local" });
    await db.settings.put({ key: "hourlyPrice", value: 5, updatedAt: 100 });

    syncService.pull.mockResolvedValue({
      projects: [{ id: "p1", updatedAt: 200, name: "remote" }],
      settings: [{ key: "hourlyPrice", value: 99, updatedAt: 200 }],
      cursor: 555,
    });

    await syncManager.sync();

    const project = await db.projects.get("p1");
    expect(project.name).toBe("remote");
    const setting = await db.settings.get("hourlyPrice");
    expect(setting.value).toBe(99);
    expect(await internalRepository.get(SYNC_CURSOR_KEY)).toBe(555);
  });

  it("ignores pulled records older than local (LWW preserves local)", async () => {
    await projectRepository.save({ id: "p1", updatedAt: 500, name: "local" });
    await db.settings.put({ key: "hourlyPrice", value: 7, updatedAt: 500 });

    syncService.pull.mockResolvedValue({
      projects: [{ id: "p1", updatedAt: 100, name: "remote-old" }],
      settings: [{ key: "hourlyPrice", value: 1, updatedAt: 100 }],
      cursor: 600,
    });

    await syncManager.sync();

    const project = await db.projects.get("p1");
    expect(project.name).toBe("local");
    const setting = await db.settings.get("hourlyPrice");
    expect(setting.value).toBe(7);
  });

  it("clears token on 401 and aborts silently", async () => {
    syncService.pull.mockRejectedValue(
      new SyncError("http_401", { status: 401, body: { error: "x" } }),
    );

    await expect(syncManager.sync()).resolves.toBeUndefined();
    expect(await internalRepository.get(SYNC_TOKEN_KEY)).toBeUndefined();
  });

  it("does not throw on network error", async () => {
    syncService.pull.mockRejectedValue(
      new SyncError("network_error", { body: "Failed to fetch" }),
    );

    await expect(syncManager.sync()).resolves.toBeUndefined();
    expect(await internalRepository.get(SYNC_TOKEN_KEY)).toBe("tok");
  });

  it("dedupes concurrent sync() calls (inFlight)", async () => {
    let resolvePull;
    syncService.pull.mockReturnValue(
      new Promise((res) => {
        resolvePull = res;
      }),
    );

    const a = syncManager.sync();
    const b = syncManager.sync();
    expect(a).toBe(b);

    resolvePull({ projects: [], settings: [], cursor: 0 });
    await a;
    await b;
    expect(syncService.pull).toHaveBeenCalledTimes(1);
  });
});

describe("syncManager.scheduleSync", () => {
  beforeEach(async () => {
    await internalRepository.set(SYNC_TOKEN_KEY, "tok");
    syncService.pull.mockResolvedValue({
      projects: [],
      settings: [],
      cursor: 0,
    });
  });

  it("debounces multiple calls into a single sync", async () => {
    vi.useFakeTimers();

    syncManager.scheduleSync("a");
    syncManager.scheduleSync("b");
    syncManager.scheduleSync("c");

    expect(syncService.pull).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2100);
    vi.useRealTimers();
    await new Promise((r) => setTimeout(r, 10));

    expect(syncService.pull).toHaveBeenCalledTimes(1);
  });
});
