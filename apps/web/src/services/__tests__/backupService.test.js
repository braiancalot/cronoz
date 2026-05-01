import { beforeEach, describe, expect, it } from "vitest";
import db from "@/services/db.js";
import backupService, {
  BackupError,
  SCHEMA_VERSION,
} from "@/services/backupService.js";

beforeEach(async () => {
  await db.projects.clear();
  await db.settings.clear();
  await db.internal.clear();
});

describe("exportData", () => {
  it("returns shape with schemaVersion, exportedAt, projects, settings", async () => {
    const before = Date.now();
    const data = await backupService.exportData();

    expect(data.schemaVersion).toBe(SCHEMA_VERSION);
    expect(data.exportedAt).toBeGreaterThanOrEqual(before);
    expect(Array.isArray(data.projects)).toBe(true);
    expect(Array.isArray(data.settings)).toBe(true);
  });

  it("includes all projects, including soft-deleted", async () => {
    await db.projects.bulkPut([
      { id: "p1", name: "Live", updatedAt: 100 },
      { id: "p2", name: "Deleted", updatedAt: 200, deletedAt: 200 },
    ]);

    const data = await backupService.exportData();
    expect(data.projects).toHaveLength(2);
    expect(data.projects.find((p) => p.id === "p2").deletedAt).toBe(200);
  });

  it("includes laps with deletedAt (lap tombstones)", async () => {
    await db.projects.put({
      id: "p1",
      name: "P",
      updatedAt: 100,
      stopwatch: {
        laps: [
          { id: "l1", name: "Lap 1", lapTime: 1000, createdAt: 50 },
          {
            id: "l2",
            name: "Lap 2",
            lapTime: 2000,
            createdAt: 75,
            deletedAt: 90,
          },
        ],
      },
    });

    const data = await backupService.exportData();
    const laps = data.projects[0].stopwatch.laps;
    expect(laps).toHaveLength(2);
    expect(laps.find((l) => l.id === "l2").deletedAt).toBe(90);
  });

  it("includes settings with updatedAt", async () => {
    await db.settings.put({ key: "hourlyPrice", value: 50, updatedAt: 123 });
    const data = await backupService.exportData();
    expect(data.settings).toEqual([
      { key: "hourlyPrice", value: 50, updatedAt: 123 },
    ]);
  });
});

describe("parseBackup", () => {
  function makeValid(overrides = {}) {
    return JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      exportedAt: 1,
      projects: [],
      settings: [],
      ...overrides,
    });
  }

  it("accepts a valid backup", () => {
    const result = backupService.parseBackup(makeValid());
    expect(result.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it("rejects non-JSON text", () => {
    expect(() => backupService.parseBackup("not json")).toThrow(BackupError);
    try {
      backupService.parseBackup("not json");
    } catch (err) {
      expect(err.code).toBe("invalid_json");
    }
  });

  it("rejects null", () => {
    expect(() => backupService.parseBackup("null")).toThrow(/Arquivo inválido/);
  });

  it("rejects unsupported schemaVersion", () => {
    const text = makeValid({ schemaVersion: 999 });
    try {
      backupService.parseBackup(text);
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(BackupError);
      expect(err.code).toBe("unsupported_version");
    }
  });

  it("rejects when projects is missing", () => {
    const text = JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      exportedAt: 1,
      settings: [],
    });
    try {
      backupService.parseBackup(text);
      throw new Error("should have thrown");
    } catch (err) {
      expect(err.code).toBe("invalid_shape");
    }
  });

  it("rejects when settings is missing", () => {
    const text = JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      exportedAt: 1,
      projects: [],
    });
    try {
      backupService.parseBackup(text);
      throw new Error("should have thrown");
    } catch (err) {
      expect(err.code).toBe("invalid_shape");
    }
  });
});

describe("applyBackup", () => {
  it("replaces all local projects and settings", async () => {
    await db.projects.put({ id: "old", name: "Old", updatedAt: 1 });
    await db.settings.put({ key: "old", value: "x", updatedAt: 1 });

    await backupService.applyBackup({
      schemaVersion: SCHEMA_VERSION,
      exportedAt: 1,
      projects: [{ id: "new", name: "New", updatedAt: 2 }],
      settings: [{ key: "hourlyPrice", value: 99, updatedAt: 2 }],
    });

    const projects = await db.projects.toArray();
    const settings = await db.settings.toArray();
    expect(projects).toEqual([{ id: "new", name: "New", updatedAt: 2 }]);
    expect(settings).toEqual([{ key: "hourlyPrice", value: 99, updatedAt: 2 }]);
  });

  it("preserves deletedAt and updatedAt from imported records", async () => {
    await backupService.applyBackup({
      schemaVersion: SCHEMA_VERSION,
      exportedAt: 1,
      projects: [{ id: "p1", name: "X", updatedAt: 500, deletedAt: 500 }],
      settings: [],
    });

    const project = await db.projects.get("p1");
    expect(project.deletedAt).toBe(500);
    expect(project.updatedAt).toBe(500);
  });

  it("does not touch db.internal (pairing/device state)", async () => {
    await db.internal.put({ key: "syncToken", value: "abc" });
    await db.internal.put({ key: "deviceId", value: "dev-1" });

    await backupService.applyBackup({
      schemaVersion: SCHEMA_VERSION,
      exportedAt: 1,
      projects: [],
      settings: [],
    });

    expect(await db.internal.get("syncToken")).toEqual({
      key: "syncToken",
      value: "abc",
    });
    expect(await db.internal.get("deviceId")).toEqual({
      key: "deviceId",
      value: "dev-1",
    });
  });

  it("clears local even when backup has empty arrays", async () => {
    await db.projects.put({ id: "old", name: "Old", updatedAt: 1 });
    await db.settings.put({ key: "old", value: "x", updatedAt: 1 });

    await backupService.applyBackup({
      schemaVersion: SCHEMA_VERSION,
      exportedAt: 1,
      projects: [],
      settings: [],
    });

    expect(await db.projects.count()).toBe(0);
    expect(await db.settings.count()).toBe(0);
  });
});

describe("round-trip", () => {
  it("export → applyBackup yields identical state, including tombstones", async () => {
    const original = [
      {
        id: "p1",
        name: "Alive",
        updatedAt: 100,
        stopwatch: {
          isRunning: false,
          startTimestamp: null,
          currentLapTime: 0,
          lastActiveAt: null,
          laps: [
            { id: "l1", name: "Lap 1", lapTime: 1000, createdAt: 50 },
            {
              id: "l2",
              name: "Lap 2",
              lapTime: 2000,
              createdAt: 75,
              deletedAt: 90,
            },
          ],
        },
      },
      {
        id: "p2",
        name: "Tombstone",
        updatedAt: 200,
        deletedAt: 200,
      },
    ];
    const originalSettings = [
      { key: "hourlyPrice", value: 75, updatedAt: 300 },
    ];

    await db.projects.bulkPut(original);
    await db.settings.bulkPut(originalSettings);

    const data = await backupService.exportData();
    await db.projects.clear();
    await db.settings.clear();
    await backupService.applyBackup(data);

    const projectsAfter = await db.projects.toArray();
    const settingsAfter = await db.settings.toArray();

    expect(projectsAfter).toEqual(original);
    expect(settingsAfter).toEqual(originalSettings);
  });
});
