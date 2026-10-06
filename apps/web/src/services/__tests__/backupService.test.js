import { beforeEach, describe, expect, it } from "vitest";
import { MAX_LAPS_PER_PROJECT, MAX_PROJECT_NAME_LENGTH } from "@cronoz/shared";
import db from "@/services/db.js";
import projectRepository from "@/services/projectRepository.js";
import settingsRepository from "@/services/settingsRepository.js";
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

describe("parseBackup record validation", () => {
  const PROJECT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

  function makeLap(overrides = {}) {
    return {
      id: crypto.randomUUID(),
      name: "Base",
      lapTime: 1000,
      createdAt: 50,
      ...overrides,
    };
  }

  function makeProject(overrides = {}) {
    return {
      id: PROJECT_ID,
      name: "Cliente X",
      completedAt: null,
      createdAt: 100,
      updatedAt: 100,
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

  function backupWith({ projects = [], settings = [] }) {
    return JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      exportedAt: 1,
      projects,
      settings,
    });
  }

  function parseFailure(text) {
    try {
      backupService.parseBackup(text);
    } catch (err) {
      return err;
    }
    throw new Error("parseBackup should have thrown");
  }

  it("rejects a project name over the limit and names the record and field", () => {
    const name = "a".repeat(MAX_PROJECT_NAME_LENGTH + 1);
    const err = parseFailure(
      backupWith({ projects: [makeProject(), makeProject({ name })] }),
    );

    expect(err).toBeInstanceOf(BackupError);
    expect(err.code).toBe("invalid_shape");
    expect(err.message).toBe("Arquivo inválido: projeto 2, campo name.");
  });

  it("rejects a project without id", () => {
    const { id: _omitted, ...withoutId } = makeProject();
    const err = parseFailure(backupWith({ projects: [withoutId] }));

    expect(err.code).toBe("invalid_shape");
    expect(err.message).toBe("Arquivo inválido: projeto 1, campo id.");
  });

  it("rejects a field with the wrong type", () => {
    const err = parseFailure(
      backupWith({ projects: [makeProject({ createdAt: "yesterday" })] }),
    );

    expect(err.code).toBe("invalid_shape");
    expect(err.message).toBe("Arquivo inválido: projeto 1, campo createdAt.");
  });

  it("rejects a project with more laps than the limit", () => {
    const project = makeProject();
    project.stopwatch.laps = Array.from(
      { length: MAX_LAPS_PER_PROJECT + 1 },
      () => makeLap(),
    );
    const err = parseFailure(backupWith({ projects: [project] }));

    expect(err.code).toBe("invalid_shape");
    expect(err.message).toBe(
      "Arquivo inválido: projeto 1, campo stopwatch.laps.",
    );
  });

  it("rejects a record that is not an object", () => {
    const err = parseFailure(backupWith({ projects: ["oops"] }));

    expect(err.code).toBe("invalid_shape");
    expect(err.message).toBe("Arquivo inválido: projeto 1.");
  });

  it("rejects a setting with a value of the wrong type", () => {
    const err = parseFailure(
      backupWith({ settings: [{ key: "hourlyPrice", value: { a: 1 } }] }),
    );

    expect(err.code).toBe("invalid_shape");
    expect(err.message).toBe("Arquivo inválido: configuração 1, campo value.");
  });

  it("drops unknown fields at every level", () => {
    const project = makeProject({ injected: "x" });
    project.stopwatch.injected = "x";
    project.stopwatch.laps = [makeLap({ injected: "x" })];
    const setting = { key: "hourlyPrice", value: 50, injected: "x" };

    const parsed = backupService.parseBackup(
      backupWith({ projects: [project], settings: [setting] }),
    );

    expect(JSON.stringify(parsed)).not.toContain("injected");
    expect(parsed.projects[0].name).toBe("Cliente X");
    expect(parsed.settings).toEqual([{ key: "hourlyPrice", value: 50 }]);
  });

  it("drops unknown top-level fields", () => {
    const text = JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      exportedAt: 1,
      projects: [],
      settings: [],
      internal: [{ key: "deviceSecret", value: "x" }],
    });

    expect(backupService.parseBackup(text)).toEqual({
      schemaVersion: SCHEMA_VERSION,
      exportedAt: 1,
      projects: [],
      settings: [],
    });
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

  // Records come from the real repositories: a field the schema does not
  // declare would be dropped on import with no error anywhere.
  it("export → parseBackup → applyBackup keeps what the app itself wrote", async () => {
    const { id } = await projectRepository.create();
    await projectRepository.addTag({ id, name: "Crochê" });
    await projectRepository.addLap({ id, lapTime: 5000, name: "Base" });
    await projectRepository.complete(id);
    const removed = await projectRepository.create();
    await projectRepository.remove(removed.id);
    await settingsRepository.set("hourlyPrice", 42);
    await settingsRepository.set("hideTags", true);

    const projectsBefore = await db.projects.toArray();
    const settingsBefore = await db.settings.toArray();
    const text = JSON.stringify(await backupService.exportData());
    await db.projects.clear();
    await db.settings.clear();
    await backupService.applyBackup(backupService.parseBackup(text));

    expect(await db.projects.toArray()).toEqual(projectsBefore);
    expect(await db.settings.toArray()).toEqual(settingsBefore);
  });
});
