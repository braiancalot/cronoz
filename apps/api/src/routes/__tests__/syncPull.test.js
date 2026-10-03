import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { devices, syncCursors } from "../../db/schema.js";
import {
  DEVICE_A,
  DEVICE_B,
  DEVICE_C,
  DEVICE_D,
  credentialOf,
  initiate,
  join,
  pair,
  post,
} from "../../../test/pairingFixtures.js";
import { PROJECT_2, makeProject } from "../../../test/projectFixtures.js";

describe("POST /api/sync/pull", () => {
  it("returns 401 without Authorization", async () => {
    const res = await post("/api/sync/pull", { cursor: 0 });
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid body", async () => {
    const { credential } = await pair(DEVICE_A, DEVICE_B);
    const res = await post("/api/sync/pull", { cursor: "abc" }, credential);
    expect(res.status).toBe(400);
  });

  it("returns all records of the group when cursor is 0", async () => {
    const { credential } = await pair(DEVICE_A, DEVICE_B);
    const project = makeProject();
    await post(
      "/api/sync/push",
      {
        projects: [project],
        settings: [{ key: "hourlyPrice", value: 80, updatedAt: 500 }],
      },
      credential,
    );

    const res = await post("/api/sync/pull", { cursor: 0 }, credential);
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
    const { credential } = await pair(DEVICE_A, DEVICE_B);
    const pushRes = await post(
      "/api/sync/push",
      { projects: [makeProject()], settings: [] },
      credential,
    );
    const { serverTimestamp } = await pushRes.json();

    const res = await post(
      "/api/sync/pull",
      { cursor: serverTimestamp },
      credential,
    );
    const body = await res.json();
    expect(body.projects).toHaveLength(0);
    expect(body.settings).toHaveLength(0);
    expect(body.cursor).toBe(serverTimestamp);
  });

  it("updates sync_cursors.last_pulled_at for the device", async () => {
    const { credential } = await pair(DEVICE_A, DEVICE_B);
    await post(
      "/api/sync/push",
      { projects: [makeProject()], settings: [] },
      credential,
    );

    const res = await post("/api/sync/pull", { cursor: 0 }, credential);
    const body = await res.json();

    const [cursorRow] = await db
      .select()
      .from(syncCursors)
      .where(eq(syncCursors.deviceId, DEVICE_B));
    expect(cursorRow.lastPulledAt).toBe(body.cursor);
  });

  it("does not return records from other sync groups", async () => {
    const { credential: credentialA } = await pair(DEVICE_A, DEVICE_B);
    await post(
      "/api/sync/push",
      { projects: [makeProject()], settings: [] },
      credentialA,
    );

    const { credential: credentialC } = await pair(DEVICE_C, DEVICE_D);
    const res = await post("/api/sync/pull", { cursor: 0 }, credentialC);
    const body = await res.json();
    expect(body.projects).toHaveLength(0);
  });

  it("returns soft-deleted projects so the client can propagate deletions", async () => {
    const { credential } = await pair(DEVICE_A, DEVICE_B);
    await post(
      "/api/sync/push",
      {
        projects: [makeProject({ updatedAt: 2000, deletedAt: 2000 })],
        settings: [],
      },
      credential,
    );

    const res = await post("/api/sync/pull", { cursor: 0 }, credential);
    const body = await res.json();
    expect(body.projects).toHaveLength(1);
    expect(body.projects[0].deletedAt).toBe(2000);
  });
});

describe("end-to-end: device A pushes, device B pulls", () => {
  it("propagates a project from A to B and back", async () => {
    const { credential: credentialB, syncGroupId } = await pair(
      DEVICE_A,
      DEVICE_B,
    );
    const credentialA = credentialOf(DEVICE_A);

    await post(
      "/api/sync/push",
      {
        projects: [
          makeProject({ id: PROJECT_2, updatedAt: 1000, name: "from A" }),
        ],
        settings: [],
      },
      credentialA,
    );

    const pullB = await post("/api/sync/pull", { cursor: 0 }, credentialB);
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
      credentialB,
    );

    const pullA = await post("/api/sync/pull", { cursor: 0 }, credentialA);
    const bodyA = await pullA.json();
    const updated = bodyA.projects.find((p) => p.id === PROJECT_2);
    expect(updated.name).toBe("from B");
    expect(updated.updatedAt).toBe(2000);
    expect(syncGroupId).toBeTruthy();
  });

  it("propagates the project tags from A to B", async () => {
    const { credential: credentialB } = await pair(DEVICE_A, DEVICE_B);
    const credentialA = credentialOf(DEVICE_A);

    await post(
      "/api/sync/push",
      {
        projects: [makeProject({ id: PROJECT_2, tags: ["Crochê", "Urgente"] })],
        settings: [],
      },
      credentialA,
    );

    const pullB = await post("/api/sync/pull", { cursor: 0 }, credentialB);
    const bodyB = await pullB.json();
    const pulled = bodyB.projects.find((p) => p.id === PROJECT_2);
    expect(pulled.tags).toEqual(["Crochê", "Urgente"]);
  });
});

describe("end-to-end: A, B, C in same group", () => {
  it("propagates a project across three devices", async () => {
    const { credential: credentialB } = await pair(DEVICE_A, DEVICE_B);
    const credentialA = credentialOf(DEVICE_A);

    const code = await initiate(DEVICE_A);
    const joinRes = await join(DEVICE_C, code);
    expect(joinRes.status).toBe(200);
    const credentialC = credentialOf(DEVICE_C);

    await post(
      "/api/sync/push",
      {
        projects: [
          makeProject({ id: PROJECT_2, updatedAt: 1000, name: "from A" }),
        ],
        settings: [],
      },
      credentialA,
    );

    const pullB = await post("/api/sync/pull", { cursor: 0 }, credentialB);
    const bodyB = await pullB.json();
    expect(bodyB.projects.find((p) => p.id === PROJECT_2)?.name).toBe("from A");

    const pullC = await post("/api/sync/pull", { cursor: 0 }, credentialC);
    const bodyC = await pullC.json();
    expect(bodyC.projects.find((p) => p.id === PROJECT_2)?.name).toBe("from A");

    await post(
      "/api/sync/push",
      {
        projects: [
          makeProject({ id: PROJECT_2, updatedAt: 2000, name: "from C" }),
        ],
        settings: [],
      },
      credentialC,
    );

    const pullA2 = await post("/api/sync/pull", { cursor: 0 }, credentialA);
    const bodyA2 = await pullA2.json();
    expect(bodyA2.projects.find((p) => p.id === PROJECT_2)?.name).toBe(
      "from C",
    );

    const pullB2 = await post("/api/sync/pull", { cursor: 0 }, credentialB);
    const bodyB2 = await pullB2.json();
    expect(bodyB2.projects.find((p) => p.id === PROJECT_2)?.name).toBe(
      "from C",
    );
  });
});
