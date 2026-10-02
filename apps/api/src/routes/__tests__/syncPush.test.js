import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import {
  MAX_LAP_NAME_LENGTH,
  MAX_PROJECT_NAME_LENGTH,
  MAX_PUSH_PROJECTS,
} from "@cronoz/shared";
import { MAX_PUSH_BODY_BYTES } from "../sync.js";
import { db } from "../../db/index.js";
import {
  projects as projectsTable,
  settings as settingsTable,
} from "../../db/schema.js";
import {
  DEVICE_A,
  DEVICE_B,
  DEVICE_C,
  DEVICE_D,
  pair,
  post,
} from "../../../test/pairingFixtures.js";
import { PROJECT_1, makeProject } from "../../../test/projectFixtures.js";

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

  it("returns 400 when the push carries more projects than the limit", async () => {
    const { token } = await pair(DEVICE_A, DEVICE_B);
    const projects = Array.from({ length: MAX_PUSH_PROJECTS + 1 }, () =>
      makeProject({ id: crypto.randomUUID() }),
    );
    const res = await post("/api/sync/push", { projects, settings: [] }, token);
    expect(res.status).toBe(400);
  });

  it("returns 400 when a project name is over the limit", async () => {
    const { token } = await pair(DEVICE_A, DEVICE_B);
    const name = "a".repeat(MAX_PROJECT_NAME_LENGTH + 1);
    const res = await post(
      "/api/sync/push",
      { projects: [makeProject({ name })], settings: [] },
      token,
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when a lap name is over the limit", async () => {
    const { token } = await pair(DEVICE_A, DEVICE_B);
    const lap = {
      id: crypto.randomUUID(),
      name: "a".repeat(MAX_LAP_NAME_LENGTH + 1),
      lapTime: 1000,
      createdAt: 1000,
    };
    const project = makeProject();
    project.stopwatch.laps = [lap];
    const res = await post(
      "/api/sync/push",
      { projects: [project], settings: [] },
      token,
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when a setting value is not a number or boolean", async () => {
    const { token } = await pair(DEVICE_A, DEVICE_B);
    const res = await post(
      "/api/sync/push",
      { projects: [], settings: [{ key: "hourlyPrice", value: { a: 1 } }] },
      token,
    );
    expect(res.status).toBe(400);
  });

  it("returns 413 when the body is over the byte limit", async () => {
    const { token } = await pair(DEVICE_A, DEVICE_B);
    const padding = "a".repeat(MAX_PUSH_BODY_BYTES);
    const res = await post(
      "/api/sync/push",
      { projects: [], settings: [], padding },
      token,
    );
    expect(res.status).toBe(413);
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
