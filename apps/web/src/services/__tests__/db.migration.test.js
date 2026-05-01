import { describe, it, expect, beforeEach } from "vitest";
import Dexie from "dexie";

const DB_NAME = "cronoz-migration-test";

async function createV1Database(projects) {
  const db = new Dexie(DB_NAME);
  db.version(1).stores({
    projects: "id, completedAt, createdAt",
    settings: "key",
  });
  await db.open();
  for (const project of projects) {
    await db.projects.put(project);
  }
  db.close();
}

async function openV2Database() {
  const db = new Dexie(DB_NAME);
  db.version(1).stores({
    projects: "id, completedAt, createdAt",
    settings: "key",
  });
  db.version(2)
    .stores({
      projects: "id, completedAt, createdAt",
      settings: "key",
    })
    .upgrade((tx) => {
      return tx
        .table("projects")
        .toCollection()
        .modify((project) => {
          const sw = project.stopwatch;
          if (sw && "totalTime" in sw) {
            const lastLapTotalTime = sw.laps?.[0]?.totalTime ?? 0;
            sw.currentLapTime = Math.max(0, sw.totalTime - lastLapTotalTime);
            delete sw.totalTime;

            if (sw.laps) {
              for (const lap of sw.laps) {
                delete lap.totalTime;
              }
            }
          }
        });
    });
  await db.open();
  return db;
}

beforeEach(async () => {
  await Dexie.delete(DB_NAME);
});

describe("Dexie v1 → v2 migration", () => {
  it("migrates project without laps: currentLapTime = totalTime", async () => {
    await createV1Database([
      {
        id: "p1",
        name: "No Laps",
        completedAt: null,
        createdAt: 1000,
        stopwatch: {
          isRunning: false,
          startTimestamp: null,
          totalTime: 5000,
          laps: [],
        },
      },
    ]);

    const db = await openV2Database();
    const project = await db.projects.get("p1");

    expect(project.stopwatch.currentLapTime).toBe(5000);
    expect(project.stopwatch.totalTime).toBeUndefined();
    db.close();
  });

  it("migrates project with laps: currentLapTime = totalTime - laps[0].totalTime", async () => {
    await createV1Database([
      {
        id: "p2",
        name: "With Laps",
        completedAt: null,
        createdAt: 1000,
        stopwatch: {
          isRunning: false,
          startTimestamp: null,
          totalTime: 9000,
          laps: [
            {
              id: "l2",
              name: "Lap #2",
              totalTime: 7000,
              lapTime: 4000,
              createdAt: 3000,
            },
            {
              id: "l1",
              name: "Lap #1",
              totalTime: 3000,
              lapTime: 3000,
              createdAt: 2000,
            },
          ],
        },
      },
    ]);

    const db = await openV2Database();
    const project = await db.projects.get("p2");

    // currentLapTime = 9000 - 7000 = 2000
    expect(project.stopwatch.currentLapTime).toBe(2000);
    expect(project.stopwatch.totalTime).toBeUndefined();

    // laps should not have totalTime anymore
    for (const lap of project.stopwatch.laps) {
      expect(lap.totalTime).toBeUndefined();
      expect(lap.lapTime).toBeTypeOf("number");
    }
    db.close();
  });

  it("preserves isRunning and startTimestamp during migration", async () => {
    await createV1Database([
      {
        id: "p3",
        name: "Running",
        completedAt: null,
        createdAt: 1000,
        stopwatch: {
          isRunning: true,
          startTimestamp: 50000,
          totalTime: 3000,
          laps: [],
        },
      },
    ]);

    const db = await openV2Database();
    const project = await db.projects.get("p3");

    expect(project.stopwatch.isRunning).toBe(true);
    expect(project.stopwatch.startTimestamp).toBe(50000);
    expect(project.stopwatch.currentLapTime).toBe(3000);
    db.close();
  });

  it("handles edge case where totalTime < laps[0].totalTime (clamps to 0)", async () => {
    await createV1Database([
      {
        id: "p4",
        name: "Edge Case",
        completedAt: null,
        createdAt: 1000,
        stopwatch: {
          isRunning: false,
          startTimestamp: null,
          totalTime: 5000,
          laps: [
            {
              id: "l1",
              name: "Lap #1",
              totalTime: 6000,
              lapTime: 6000,
              createdAt: 2000,
            },
          ],
        },
      },
    ]);

    const db = await openV2Database();
    const project = await db.projects.get("p4");

    expect(project.stopwatch.currentLapTime).toBe(0);
    db.close();
  });
});

async function createV2Database(projects) {
  const db = new Dexie(DB_NAME);
  db.version(1).stores({
    projects: "id, completedAt, createdAt",
    settings: "key",
  });
  db.version(2)
    .stores({
      projects: "id, completedAt, createdAt",
      settings: "key",
    })
    .upgrade(() => {});
  await db.open();
  for (const project of projects) {
    await db.projects.put(project);
  }
  db.close();
}

function openV3Database() {
  const db = new Dexie(DB_NAME);
  db.version(1).stores({
    projects: "id, completedAt, createdAt",
    settings: "key",
  });
  db.version(2)
    .stores({
      projects: "id, completedAt, createdAt",
      settings: "key",
    })
    .upgrade(() => {});
  db.version(3)
    .stores({
      projects: "id, completedAt, createdAt, updatedAt, deletedAt",
      settings: "key",
    })
    .upgrade((tx) => {
      return tx
        .table("projects")
        .toCollection()
        .modify((project) => {
          if (!project.updatedAt) {
            project.updatedAt = project.createdAt ?? Date.now();
          }
        });
    });
  return db.open();
}

describe("Dexie v2 → v3 migration", () => {
  it("adds updatedAt = createdAt to existing projects", async () => {
    await createV2Database([
      {
        id: "p1",
        name: "Project 1",
        completedAt: null,
        createdAt: 1000,
        stopwatch: {
          isRunning: false,
          startTimestamp: null,
          currentLapTime: 0,
          laps: [],
        },
      },
    ]);

    const db = await openV3Database();
    const project = await db.projects.get("p1");

    expect(project.updatedAt).toBe(1000);
    expect(project.deletedAt).toBeUndefined();
    db.close();
  });

  it("does not overwrite updatedAt if already set", async () => {
    await createV2Database([
      {
        id: "p2",
        name: "Project 2",
        completedAt: null,
        createdAt: 1000,
        updatedAt: 2000,
        stopwatch: {
          isRunning: false,
          startTimestamp: null,
          currentLapTime: 0,
          laps: [],
        },
      },
    ]);

    const db = await openV3Database();
    const project = await db.projects.get("p2");

    expect(project.updatedAt).toBe(2000);
    db.close();
  });

  it("migrates multiple projects", async () => {
    await createV2Database([
      {
        id: "p1",
        name: "Project 1",
        completedAt: null,
        createdAt: 1000,
        stopwatch: {
          isRunning: false,
          startTimestamp: null,
          currentLapTime: 0,
          laps: [],
        },
      },
      {
        id: "p2",
        name: "Project 2",
        completedAt: null,
        createdAt: 2000,
        stopwatch: {
          isRunning: false,
          startTimestamp: null,
          currentLapTime: 0,
          laps: [],
        },
      },
    ]);

    const db = await openV3Database();
    const p1 = await db.projects.get("p1");
    const p2 = await db.projects.get("p2");

    expect(p1.updatedAt).toBe(1000);
    expect(p2.updatedAt).toBe(2000);
    db.close();
  });

  it("preserves all existing project fields", async () => {
    await createV2Database([
      {
        id: "p1",
        name: "Full Project",
        completedAt: 5000,
        createdAt: 1000,
        stopwatch: {
          isRunning: true,
          startTimestamp: 3000,
          currentLapTime: 500,
          laps: [{ id: "l1", name: "Lap 1", lapTime: 2000, createdAt: 2000 }],
        },
      },
    ]);

    const db = await openV3Database();
    const project = await db.projects.get("p1");

    expect(project.name).toBe("Full Project");
    expect(project.completedAt).toBe(5000);
    expect(project.stopwatch.isRunning).toBe(true);
    expect(project.stopwatch.startTimestamp).toBe(3000);
    expect(project.stopwatch.currentLapTime).toBe(500);
    expect(project.stopwatch.laps).toHaveLength(1);
    expect(project.updatedAt).toBe(1000);
    db.close();
  });
});
