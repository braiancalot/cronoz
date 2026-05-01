import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import app from "../../app.js";
import { db } from "../../db/index.js";
import {
  projects as projectsTable,
  settings as settingsTable,
  syncCursors,
} from "../../db/schema.js";

const DEVICE_A = "11111111-1111-1111-1111-111111111111";
const DEVICE_B = "22222222-2222-2222-2222-222222222222";
const DEVICE_C = "33333333-3333-3333-3333-333333333333";
const DEVICE_D = "44444444-4444-4444-4444-444444444444";

const PROJECT_1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const PROJECT_2 = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function post(path, body, token) {
  return app.request(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function initiate(deviceId) {
  const res = await post("/api/pair/initiate", { deviceId });
  const body = await res.json();
  return body.code;
}

async function pair(deviceA, deviceB) {
  const code = await initiate(deviceA);
  const res = await post("/api/pair/join", { deviceId: deviceB, code });
  const body = await res.json();
  return { token: body.token, syncGroupId: body.syncGroupId };
}

async function tokenFor(deviceId) {
  const res = await post("/api/pair/token", { deviceId });
  const body = await res.json();
  return body.token;
}

function makeProject(overrides = {}) {
  return {
    id: PROJECT_1,
    name: "Cliente X",
    completedAt: null,
    createdAt: 1000,
    updatedAt: 1000,
    deletedAt: null,
    stopwatch: {
      startTimestamp: null,
      currentLapTime: 0,
      isRunning: false,
      lastActiveAt: null,
      laps: [],
    },
    ...overrides,
  };
}

describe("POST /api/sync/push", () => {
  it("returns 401 without Authorization", async () => {
    const res = await post("/api/sync/push", { projects: [], settings: [] });
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid body", async () => {
    const { token } = await pair(DEVICE_A, DEVICE_B);
    const res = await post(
      "/api/sync/push",
      { projects: [{ id: "not-a-uuid" }], settings: [] },
      token,
    );
    expect(res.status).toBe(400);
  });

  it("inserts a new project with serverUpdatedAt set", async () => {
    const { token, syncGroupId } = await pair(DEVICE_A, DEVICE_B);
    const project = makeProject();

    const before = Date.now();
    const res = await post(
      "/api/sync/push",
      { projects: [project], settings: [] },
      token,
    );
    const after = Date.now();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.serverTimestamp).toBeGreaterThanOrEqual(before);
    expect(body.serverTimestamp).toBeLessThanOrEqual(after);

    const [row] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, PROJECT_1));
    expect(row.syncGroupId).toBe(syncGroupId);
    expect(row.data).toEqual(project);
    expect(row.updatedAt).toBe(1000);
    expect(row.deletedAt).toBeNull();
    expect(row.serverUpdatedAt).toBe(body.serverTimestamp);
  });

  it("inserts a new setting", async () => {
    const { token, syncGroupId } = await pair(DEVICE_A, DEVICE_B);

    const res = await post(
      "/api/sync/push",
      {
        projects: [],
        settings: [{ key: "hourlyPrice", value: 80, updatedAt: 500 }],
      },
      token,
    );
    expect(res.status).toBe(200);

    const [row] = await db.select().from(settingsTable);
    expect(row.syncGroupId).toBe(syncGroupId);
    expect(row.key).toBe("hourlyPrice");
    expect(row.value).toBe(80);
    expect(row.updatedAt).toBe(500);
  });

  it("LWW: ignores incoming when existing.updatedAt is greater", async () => {
    const { token } = await pair(DEVICE_A, DEVICE_B);
    await post(
      "/api/sync/push",
      {
        projects: [makeProject({ updatedAt: 2000, name: "newer" })],
        settings: [],
      },
      token,
    );

    await post(
      "/api/sync/push",
      {
        projects: [makeProject({ updatedAt: 1000, name: "older" })],
        settings: [],
      },
      token,
    );

    const [row] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, PROJECT_1));
    expect(row.updatedAt).toBe(2000);
    expect(row.data.name).toBe("newer");
  });

  it("LWW: overwrites when incoming.updatedAt is greater", async () => {
    const { token } = await pair(DEVICE_A, DEVICE_B);
    await post(
      "/api/sync/push",
      {
        projects: [makeProject({ updatedAt: 1000, name: "older" })],
        settings: [],
      },
      token,
    );
    await post(
      "/api/sync/push",
      {
        projects: [makeProject({ updatedAt: 2000, name: "newer" })],
        settings: [],
      },
      token,
    );

    const [row] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, PROJECT_1));
    expect(row.updatedAt).toBe(2000);
    expect(row.data.name).toBe("newer");
  });

  it("persists soft delete (deletedAt populated)", async () => {
    const { token } = await pair(DEVICE_A, DEVICE_B);
    await post(
      "/api/sync/push",
      { projects: [makeProject({ updatedAt: 1000 })], settings: [] },
      token,
    );

    await post(
      "/api/sync/push",
      {
        projects: [makeProject({ updatedAt: 2000, deletedAt: 2000 })],
        settings: [],
      },
      token,
    );

    const [row] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, PROJECT_1));
    expect(row.deletedAt).toBe(2000);
  });

  it("returns 409 when a project id already belongs to another sync group", async () => {
    const { token: tokenA } = await pair(DEVICE_A, DEVICE_B);
    await post(
      "/api/sync/push",
      { projects: [makeProject()], settings: [] },
      tokenA,
    );

    const { token: tokenC } = await pair(DEVICE_C, DEVICE_D);
    const res = await post(
      "/api/sync/push",
      { projects: [makeProject()], settings: [] },
      tokenC,
    );
    expect(res.status).toBe(409);
  });
});

describe("POST /api/sync/pull", () => {
  it("returns 401 without Authorization", async () => {
    const res = await post("/api/sync/pull", { cursor: 0 });
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid body", async () => {
    const { token } = await pair(DEVICE_A, DEVICE_B);
    const res = await post("/api/sync/pull", { cursor: "abc" }, token);
    expect(res.status).toBe(400);
  });

  it("returns all records of the group when cursor is 0", async () => {
    const { token } = await pair(DEVICE_A, DEVICE_B);
    const project = makeProject();
    await post(
      "/api/sync/push",
      {
        projects: [project],
        settings: [{ key: "hourlyPrice", value: 80, updatedAt: 500 }],
      },
      token,
    );

    const res = await post("/api/sync/pull", { cursor: 0 }, token);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.projects).toHaveLength(1);
    expect(body.projects[0]).toEqual(project);
    expect(body.settings).toHaveLength(1);
    expect(body.settings[0]).toMatchObject({
      key: "hourlyPrice",
      value: 80,
      updatedAt: 500,
    });
    expect(body.cursor).toBeGreaterThan(0);
  });

  it("returns empty when cursor matches latest serverTimestamp", async () => {
    const { token } = await pair(DEVICE_A, DEVICE_B);
    const pushRes = await post(
      "/api/sync/push",
      { projects: [makeProject()], settings: [] },
      token,
    );
    const { serverTimestamp } = await pushRes.json();

    const res = await post(
      "/api/sync/pull",
      { cursor: serverTimestamp },
      token,
    );
    const body = await res.json();
    expect(body.projects).toHaveLength(0);
    expect(body.settings).toHaveLength(0);
    expect(body.cursor).toBe(serverTimestamp);
  });

  it("updates sync_cursors.last_pulled_at for the device", async () => {
    const { token } = await pair(DEVICE_A, DEVICE_B);
    await post(
      "/api/sync/push",
      { projects: [makeProject()], settings: [] },
      token,
    );

    const res = await post("/api/sync/pull", { cursor: 0 }, token);
    const body = await res.json();

    const [cursorRow] = await db
      .select()
      .from(syncCursors)
      .where(eq(syncCursors.deviceId, DEVICE_B));
    expect(cursorRow.lastPulledAt).toBe(body.cursor);
  });

  it("does not return records from other sync groups", async () => {
    const { token: tokenA } = await pair(DEVICE_A, DEVICE_B);
    await post(
      "/api/sync/push",
      { projects: [makeProject()], settings: [] },
      tokenA,
    );

    const { token: tokenC } = await pair(DEVICE_C, DEVICE_D);
    const res = await post("/api/sync/pull", { cursor: 0 }, tokenC);
    const body = await res.json();
    expect(body.projects).toHaveLength(0);
  });

  it("returns soft-deleted projects so the client can propagate deletions", async () => {
    const { token } = await pair(DEVICE_A, DEVICE_B);
    await post(
      "/api/sync/push",
      {
        projects: [makeProject({ updatedAt: 2000, deletedAt: 2000 })],
        settings: [],
      },
      token,
    );

    const res = await post("/api/sync/pull", { cursor: 0 }, token);
    const body = await res.json();
    expect(body.projects).toHaveLength(1);
    expect(body.projects[0].deletedAt).toBe(2000);
  });
});

describe("end-to-end: device A pushes, device B pulls", () => {
  it("propagates a project from A to B and back", async () => {
    const { token: tokenB, syncGroupId } = await pair(DEVICE_A, DEVICE_B);
    const tokenA = await tokenFor(DEVICE_A);

    await post(
      "/api/sync/push",
      {
        projects: [
          makeProject({ id: PROJECT_2, updatedAt: 1000, name: "from A" }),
        ],
        settings: [],
      },
      tokenA,
    );

    const pullB = await post("/api/sync/pull", { cursor: 0 }, tokenB);
    const bodyB = await pullB.json();
    expect(bodyB.projects).toHaveLength(1);
    expect(bodyB.projects[0].name).toBe("from A");

    await post(
      "/api/sync/push",
      {
        projects: [
          makeProject({ id: PROJECT_2, updatedAt: 2000, name: "from B" }),
        ],
        settings: [],
      },
      tokenB,
    );

    const pullA = await post("/api/sync/pull", { cursor: 0 }, tokenA);
    const bodyA = await pullA.json();
    const updated = bodyA.projects.find((p) => p.id === PROJECT_2);
    expect(updated.name).toBe("from B");
    expect(updated.updatedAt).toBe(2000);
    expect(syncGroupId).toBeTruthy();
  });
});

describe("GET /api/sync/devices", () => {
  it("returns 401 without Authorization", async () => {
    const res = await app.request("/api/sync/devices");
    expect(res.status).toBe(401);
  });

  it("returns the device count for the sync group", async () => {
    const { token } = await pair(DEVICE_A, DEVICE_B);

    const res = await app.request("/api/sync/devices", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(2);
  });

  it("isolates count per sync group", async () => {
    const { token: tokenAB } = await pair(DEVICE_A, DEVICE_B);
    await pair(DEVICE_C, DEVICE_D);

    const res = await app.request("/api/sync/devices", {
      headers: { Authorization: `Bearer ${tokenAB}` },
    });
    const body = await res.json();
    expect(body.count).toBe(2);
  });

  it("returns 1 right after initiate (before any join)", async () => {
    await post("/api/pair/initiate", { deviceId: DEVICE_A });
    const token = await tokenFor(DEVICE_A);

    const res = await app.request("/api/sync/devices", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    expect(body.count).toBe(1);
  });
});
