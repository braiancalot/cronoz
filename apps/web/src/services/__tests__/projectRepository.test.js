import { describe, it, expect, beforeEach } from "vitest";
import { MAX_LAPS_PER_PROJECT } from "@cronoz/shared";
import db from "@/services/db.js";
import projectRepository, {
  DEFAULT_STOPWATCH,
} from "@/services/projectRepository.js";
import { pauseRun, startRun } from "@/lib/stopwatchTransitions.js";
import { REAL_TIME_STATUS, getRealTimeStatus } from "@/lib/realTime.js";

const RUN_START = 1_000_000;

// Runs the clock for `lapTime` and closes it into a lap, the way the app does.
async function addTimedLap(id, lapTime, name) {
  await projectRepository.updateStopwatch(id, (stopwatch) =>
    pauseRun(startRun(stopwatch, RUN_START), RUN_START + lapTime),
  );
  await projectRepository.addLap({ id, name });
}

beforeEach(async () => {
  await db.projects.clear();
});

describe("DEFAULT_STOPWATCH", () => {
  it("has currentLapTime instead of totalTime", () => {
    expect(DEFAULT_STOPWATCH).toEqual({
      startTimestamp: null,
      currentLapTime: 0,
      isRunning: false,
      lastActiveAt: null,
      laps: [],
      realTime: 0,
      editedTime: 0,
    });
  });

  it("starts tracking the real time", () => {
    expect(getRealTimeStatus(DEFAULT_STOPWATCH)).toBe(REAL_TIME_STATUS.tracked);
  });
});

describe("create", () => {
  it("creates a project with UUID, default name and initial stopwatch", async () => {
    const project = await projectRepository.create();

    expect(project.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(project.name).toBe(`Projeto #${project.id.substr(0, 4)}`);
    expect(project.completedAt).toBeNull();
    expect(project.createdAt).toBeTypeOf("number");
    expect(project.tags).toEqual([]);
    expect(project.stopwatch).toEqual(DEFAULT_STOPWATCH);
  });

  it("persists the project in the database", async () => {
    const project = await projectRepository.create();
    const found = await db.projects.get(project.id);

    expect(found).toEqual(project);
  });
});

describe("getAll", () => {
  it("returns empty array when no projects exist", async () => {
    const projects = await projectRepository.getAll();
    expect(projects).toEqual([]);
  });

  it("returns all created projects", async () => {
    await projectRepository.create();
    await projectRepository.create();

    const projects = await projectRepository.getAll();
    expect(projects).toHaveLength(2);
  });
});

describe("getById", () => {
  it("returns the project by id", async () => {
    const project = await projectRepository.create();
    const found = await projectRepository.getById(project.id);

    expect(found).toEqual(project);
  });

  it("returns null for non-existent id", async () => {
    const found = await projectRepository.getById("non-existent");
    expect(found).toBeNull();
  });
});

describe("rename", () => {
  it("renames the project", async () => {
    const project = await projectRepository.create();
    await projectRepository.rename({ id: project.id, newName: "New Name" });

    const found = await projectRepository.getById(project.id);
    expect(found.name).toBe("New Name");
  });
});

describe("remove", () => {
  it("soft deletes the project (sets deletedAt)", async () => {
    const project = await projectRepository.create();
    await projectRepository.remove(project.id);

    const found = await projectRepository.getById(project.id);
    expect(found).toBeNull();

    // still exists in DB with deletedAt
    const raw = await db.projects.get(project.id);
    expect(raw).not.toBeNull();
    expect(raw.deletedAt).toBeTypeOf("number");
  });
});

describe("undeleteProject", () => {
  it("clears deletedAt on a soft-deleted project, making it visible again", async () => {
    const project = await projectRepository.create();
    await projectRepository.remove(project.id);

    expect(await projectRepository.getById(project.id)).toBeNull();

    await projectRepository.undeleteProject(project.id);

    const restored = await projectRepository.getById(project.id);
    expect(restored).not.toBeNull();
    expect(restored.deletedAt).toBeNull();
  });

  it("undeleted project reappears in getAll", async () => {
    const p1 = await projectRepository.create();
    await projectRepository.remove(p1.id);
    await projectRepository.undeleteProject(p1.id);

    const all = await projectRepository.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(p1.id);
  });

  it("bumps updatedAt", async () => {
    const project = await projectRepository.create();
    await projectRepository.remove(project.id);
    const afterDelete = (await db.projects.get(project.id)).updatedAt;

    await projectRepository.undeleteProject(project.id);
    const restored = await db.projects.get(project.id);
    expect(restored.updatedAt).toBeGreaterThanOrEqual(afterDelete);
  });
});

describe("undeleteLap", () => {
  it("clears deletedAt on a single lap without touching others", async () => {
    const project = await projectRepository.create();
    await addTimedLap(project.id, 1000, "Volta 1");
    await addTimedLap(project.id, 2000, "Volta 2");

    const before = await projectRepository.getById(project.id);
    const targetLapId = before.stopwatch.laps[1].id; // Volta 1

    await projectRepository.removeLap({ id: project.id, lapId: targetLapId });
    expect(
      (await projectRepository.getById(project.id)).stopwatch.laps,
    ).toHaveLength(1);

    await projectRepository.undeleteLap({ id: project.id, lapId: targetLapId });

    const after = await projectRepository.getById(project.id);
    expect(after.stopwatch.laps).toHaveLength(2);
    const restoredLap = after.stopwatch.laps.find((l) => l.id === targetLapId);
    expect(restoredLap.deletedAt).toBeNull();
  });

  it("bumps updatedAt", async () => {
    const project = await projectRepository.create();
    await addTimedLap(project.id, 1000, "Volta 1");
    const withLap = await projectRepository.getById(project.id);
    const lapId = withLap.stopwatch.laps[0].id;

    await projectRepository.removeLap({ id: project.id, lapId });
    const before = (await db.projects.get(project.id)).updatedAt;

    await projectRepository.undeleteLap({ id: project.id, lapId });
    const after = (await db.projects.get(project.id)).updatedAt;
    expect(after).toBeGreaterThanOrEqual(before);
  });

  it("does nothing for non-existent project", async () => {
    await expect(
      projectRepository.undeleteLap({ id: "missing", lapId: "x" }),
    ).resolves.toBeNull();
  });
});

describe("complete / reopen", () => {
  it("marks the project as completed with a timestamp", async () => {
    const project = await projectRepository.create();
    await projectRepository.complete(project.id);

    const found = await projectRepository.getById(project.id);
    expect(found.completedAt).toBeTypeOf("number");
  });

  it("reopens a completed project", async () => {
    const project = await projectRepository.create();
    await projectRepository.complete(project.id);
    await projectRepository.reopen(project.id);

    const found = await projectRepository.getById(project.id);
    expect(found.completedAt).toBeNull();
  });
});

describe("addLap", () => {
  it("ignores a lap past the sync limit", async () => {
    const project = await projectRepository.create();
    const laps = Array.from({ length: MAX_LAPS_PER_PROJECT }, (_, i) => ({
      id: crypto.randomUUID(),
      name: `Volta ${i}`,
      lapTime: 1000,
      createdAt: i,
    }));
    await db.projects.put({
      ...project,
      stopwatch: { ...project.stopwatch, currentLapTime: 700, laps },
    });

    await projectRepository.addLap({ id: project.id, name: "x" });

    const found = await db.projects.get(project.id);
    expect(found.stopwatch.laps).toHaveLength(MAX_LAPS_PER_PROJECT);
    expect(found.stopwatch.currentLapTime).toBe(700);
  });

  it("closes the stored current time into a lap and zeroes it", async () => {
    const project = await projectRepository.create();
    await db.projects.update(project.id, {
      stopwatch: { ...project.stopwatch, currentLapTime: 5000, realTime: 5000 },
    });

    await projectRepository.addLap({ id: project.id, name: "Volta 1" });

    const found = await projectRepository.getById(project.id);
    const lap = found.stopwatch.laps[0];

    expect(lap.lapTime).toBe(5000);
    expect(lap.name).toBe("Volta 1");
    expect(lap.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(lap.createdAt).toBeTypeOf("number");
    expect(found.stopwatch.currentLapTime).toBe(0);
    expect(found.stopwatch.realTime).toBe(5000);
  });

  it("pauses a clock still running instead of counting the run twice", async () => {
    const project = await projectRepository.create();
    const startedAt = Date.now() - 3000;
    await db.projects.update(project.id, {
      stopwatch: {
        ...project.stopwatch,
        isRunning: true,
        startTimestamp: startedAt,
        lastActiveAt: startedAt,
      },
    });

    await projectRepository.addLap({ id: project.id, name: "Volta 1" });

    const { stopwatch } = await db.projects.get(project.id);
    expect(stopwatch.isRunning).toBe(false);
    expect(stopwatch.startTimestamp).toBeNull();
    expect(stopwatch.laps[0].lapTime).toBeGreaterThanOrEqual(3000);
    expect(stopwatch.realTime).toBe(stopwatch.laps[0].lapTime);
    expect(getRealTimeStatus(stopwatch)).toBe(REAL_TIME_STATUS.tracked);
  });

  it("adds multiple laps each with their own lapTime", async () => {
    const project = await projectRepository.create();

    await addTimedLap(project.id, 3000, "Volta 1");
    await addTimedLap(project.id, 5000, "Volta 2");

    const found = await projectRepository.getById(project.id);
    const [secondLap, firstLap] = found.stopwatch.laps;

    expect(firstLap.lapTime).toBe(3000);
    expect(firstLap.name).toBe("Volta 1");
    expect(secondLap.lapTime).toBe(5000);
    expect(secondLap.name).toBe("Volta 2");
    expect(found.stopwatch.realTime).toBe(8000);
  });

  it("does nothing for non-existent project", async () => {
    await expect(
      projectRepository.addLap({ id: "non-existent", name: "Volta 1" }),
    ).resolves.toBeNull();
  });
});

describe("renameLap", () => {
  it("renames a specific lap", async () => {
    const project = await projectRepository.create();
    await addTimedLap(project.id, 5000, "Volta 1");

    const withLap = await projectRepository.getById(project.id);
    const lapId = withLap.stopwatch.laps[0].id;

    await projectRepository.renameLap({
      id: project.id,
      lapId,
      name: "Custom Lap",
    });

    const found = await projectRepository.getById(project.id);
    expect(found.stopwatch.laps[0].name).toBe("Custom Lap");
  });
});

describe("removeLap", () => {
  it("soft deletes a lap (sets deletedAt instead of removing)", async () => {
    const project = await projectRepository.create();
    await addTimedLap(project.id, 2000, "Volta 1");
    await addTimedLap(project.id, 3000, "Volta 2");
    await addTimedLap(project.id, 4000, "Volta 3");

    // laps order (newest first): [4000, 3000, 2000]
    const before = await projectRepository.getById(project.id);
    const middleLapId = before.stopwatch.laps[1].id; // lapTime 3000

    await projectRepository.removeLap({ id: project.id, lapId: middleLapId });

    // getById filters deleted laps
    const found = await projectRepository.getById(project.id);
    expect(found.stopwatch.laps).toHaveLength(2);

    const [newest, oldest] = found.stopwatch.laps;
    expect(oldest.lapTime).toBe(2000);
    expect(newest.lapTime).toBe(4000);

    // raw DB still has 3 laps, one with deletedAt
    const raw = await db.projects.get(project.id);
    expect(raw.stopwatch.laps).toHaveLength(3);
    const deletedLap = raw.stopwatch.laps.find((l) => l.id === middleLapId);
    expect(deletedLap.deletedAt).toBeTypeOf("number");
  });
});

describe("removeLap / undeleteLap real time", () => {
  it("counts a deleted lap as an edit, so the real time stays whole", async () => {
    const project = await projectRepository.create();
    await addTimedLap(project.id, 2000, "Volta 1");
    await addTimedLap(project.id, 3000, "Volta 2");
    const lapId = (await projectRepository.getById(project.id)).stopwatch
      .laps[0].id;

    await projectRepository.removeLap({ id: project.id, lapId });

    const found = await projectRepository.getById(project.id);
    expect(found.stopwatch.realTime).toBe(5000);
    expect(found.stopwatch.editedTime).toBe(-3000);
    expect(getRealTimeStatus(found.stopwatch)).toBe(REAL_TIME_STATUS.tracked);
  });

  it("deleting the same lap twice removes it once", async () => {
    const project = await projectRepository.create();
    await addTimedLap(project.id, 2000, "Volta 1");
    const lapId = (await projectRepository.getById(project.id)).stopwatch
      .laps[0].id;

    await projectRepository.removeLap({ id: project.id, lapId });
    const once = await db.projects.get(project.id);
    await projectRepository.removeLap({ id: project.id, lapId });
    const twice = await db.projects.get(project.id);

    expect(twice.stopwatch.editedTime).toBe(-2000);
    expect(twice.updatedAt).toBe(once.updatedAt);
  });

  it("undeleting gives the lap back to the time in use", async () => {
    const project = await projectRepository.create();
    await addTimedLap(project.id, 2000, "Volta 1");
    const lapId = (await projectRepository.getById(project.id)).stopwatch
      .laps[0].id;

    await projectRepository.removeLap({ id: project.id, lapId });
    await projectRepository.undeleteLap({ id: project.id, lapId });

    const { stopwatch } = await projectRepository.getById(project.id);
    expect(stopwatch.editedTime).toBe(0);
    expect(stopwatch.realTime).toBe(2000);
    expect(getRealTimeStatus(stopwatch)).toBe(REAL_TIME_STATUS.tracked);
  });
});

describe("updateStopwatch", () => {
  it("applies the transform to the stored stopwatch and reports both sides", async () => {
    const project = await projectRepository.create();

    const change = await projectRepository.updateStopwatch(
      project.id,
      (stopwatch) => ({
        ...stopwatch,
        currentLapTime: 5000,
      }),
    );

    expect(change.previous).toEqual(DEFAULT_STOPWATCH);
    expect(change.next).toEqual({ ...DEFAULT_STOPWATCH, currentLapTime: 5000 });
    const found = await db.projects.get(project.id);
    expect(found.stopwatch).toEqual(change.next);
  });

  it("reads the stored record, not a stale copy", async () => {
    const project = await projectRepository.create();
    await db.projects.update(project.id, {
      stopwatch: { ...project.stopwatch, currentLapTime: 9000 },
    });

    const seen = [];
    await projectRepository.updateStopwatch(project.id, (stopwatch) => {
      seen.push(stopwatch.currentLapTime);
      return stopwatch;
    });

    expect(seen).toEqual([9000]);
  });

  it("bumps updatedAt and emits a mutation when something changes", async () => {
    const project = await projectRepository.create();
    await db.projects.update(project.id, { updatedAt: 1 });

    await projectRepository.updateStopwatch(project.id, (stopwatch) => ({
      ...stopwatch,
      currentLapTime: 1,
    }));

    expect((await db.projects.get(project.id)).updatedAt).toBeGreaterThan(1);
  });

  it("writes nothing when the transform returns the same stopwatch", async () => {
    const project = await projectRepository.create();
    await db.projects.update(project.id, { updatedAt: 1 });

    const change = await projectRepository.updateStopwatch(
      project.id,
      (stopwatch) => stopwatch,
    );

    expect(change).toBeNull();
    expect((await db.projects.get(project.id)).updatedAt).toBe(1);
  });

  it("serializes concurrent updates so neither is lost", async () => {
    const project = await projectRepository.create();
    const addOne = (stopwatch) => ({
      ...stopwatch,
      currentLapTime: stopwatch.currentLapTime + 1,
    });

    await Promise.all(
      Array.from({ length: 10 }, () =>
        projectRepository.updateStopwatch(project.id, addOne),
      ),
    );

    expect((await db.projects.get(project.id)).stopwatch.currentLapTime).toBe(
      10,
    );
  });

  it("returns null for a non-existent project", async () => {
    await expect(
      projectRepository.updateStopwatch("missing-id", (stopwatch) => stopwatch),
    ).resolves.toBeNull();
    expect(await db.projects.get("missing-id")).toBeUndefined();
  });
});

describe("addTag / removeTag", () => {
  it("adds the normalized tag to a project that has none", async () => {
    const project = await projectRepository.create();

    await projectRepository.addTag({ id: project.id, name: "  Crochê " });

    const found = await projectRepository.getById(project.id);
    expect(found.tags).toEqual(["Crochê"]);
  });

  it("keeps insertion order for multiple tags", async () => {
    const project = await projectRepository.create();

    await projectRepository.addTag({ id: project.id, name: "crochê" });
    await projectRepository.addTag({ id: project.id, name: "amigurumi" });

    const found = await projectRepository.getById(project.id);
    expect(found.tags).toEqual(["crochê", "amigurumi"]);
  });

  it("preserves concurrent tag additions", async () => {
    const project = await projectRepository.create();

    await Promise.all([
      projectRepository.addTag({ id: project.id, name: "crochê" }),
      projectRepository.addTag({ id: project.id, name: "amigurumi" }),
      projectRepository.addTag({ id: project.id, name: "presente" }),
    ]);

    const found = await projectRepository.getById(project.id);
    expect(found.tags).toEqual(["crochê", "amigurumi", "presente"]);
  });

  it("ignores a duplicate that differs only in case", async () => {
    const project = await projectRepository.create();

    await projectRepository.addTag({ id: project.id, name: "Crochê" });
    await projectRepository.addTag({ id: project.id, name: "crochê" });

    const found = await projectRepository.getById(project.id);
    expect(found.tags).toEqual(["Crochê"]);
  });

  it("ignores a blank name", async () => {
    const project = await projectRepository.create();

    await projectRepository.addTag({ id: project.id, name: "   " });

    const found = await projectRepository.getById(project.id);
    expect(found.tags).toEqual([]);
  });

  it("removes by key, ignoring case and accent", async () => {
    const project = await projectRepository.create();
    await projectRepository.addTag({ id: project.id, name: "Crochê" });
    await projectRepository.addTag({ id: project.id, name: "amigurumi" });

    await projectRepository.removeTag({ id: project.id, name: "croche" });

    const found = await projectRepository.getById(project.id);
    expect(found.tags).toEqual(["amigurumi"]);
  });

  it("backfills tags on a project stored before the field existed", async () => {
    const project = await projectRepository.create();
    await db.projects.update(project.id, { tags: undefined });

    await projectRepository.addTag({ id: project.id, name: "crochê" });

    const found = await projectRepository.getById(project.id);
    expect(found.tags).toEqual(["crochê"]);
  });

  it("does nothing for a non-existent project", async () => {
    await expect(
      projectRepository.addTag({ id: "missing-id", name: "crochê" }),
    ).resolves.toBeUndefined();
    await expect(
      projectRepository.removeTag({ id: "missing-id", name: "crochê" }),
    ).resolves.toBeUndefined();

    expect(await db.projects.get("missing-id")).toBeUndefined();
  });
});

describe("updatedAt", () => {
  it("create sets updatedAt", async () => {
    const project = await projectRepository.create();
    expect(project.updatedAt).toBeTypeOf("number");
  });

  it("rename updates updatedAt", async () => {
    const project = await projectRepository.create();
    const before = project.updatedAt;

    await projectRepository.rename({ id: project.id, newName: "New" });
    const found = await projectRepository.getById(project.id);
    expect(found.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it("complete updates updatedAt", async () => {
    const project = await projectRepository.create();
    const before = project.updatedAt;

    await projectRepository.complete(project.id);
    const found = await projectRepository.getById(project.id);
    expect(found.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it("reopen updates updatedAt", async () => {
    const project = await projectRepository.create();
    await projectRepository.complete(project.id);
    const afterComplete = (await projectRepository.getById(project.id))
      .updatedAt;

    await projectRepository.reopen(project.id);
    const found = await projectRepository.getById(project.id);
    expect(found.updatedAt).toBeGreaterThanOrEqual(afterComplete);
  });

  it("remove updates updatedAt", async () => {
    const project = await projectRepository.create();
    await projectRepository.remove(project.id);

    const raw = await db.projects.get(project.id);
    expect(raw.updatedAt).toBeGreaterThanOrEqual(project.updatedAt);
  });

  it("addLap updates updatedAt", async () => {
    const project = await projectRepository.create();
    const before = project.updatedAt;

    await addTimedLap(project.id, 5000, "Volta 1");
    const found = await projectRepository.getById(project.id);
    expect(found.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it("renameLap updates updatedAt", async () => {
    const project = await projectRepository.create();
    await addTimedLap(project.id, 5000, "Volta 1");
    const withLap = await projectRepository.getById(project.id);
    const before = withLap.updatedAt;

    await projectRepository.renameLap({
      id: project.id,
      lapId: withLap.stopwatch.laps[0].id,
      name: "Renamed",
    });
    const found = await projectRepository.getById(project.id);
    expect(found.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it("removeLap updates updatedAt", async () => {
    const project = await projectRepository.create();
    await addTimedLap(project.id, 5000, "Volta 1");
    const withLap = await projectRepository.getById(project.id);
    const before = withLap.updatedAt;

    await projectRepository.removeLap({
      id: project.id,
      lapId: withLap.stopwatch.laps[0].id,
    });
    const found = await projectRepository.getById(project.id);
    expect(found.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it("addTag updates updatedAt", async () => {
    const project = await projectRepository.create();
    const before = project.updatedAt;

    await projectRepository.addTag({ id: project.id, name: "crochê" });

    const found = await projectRepository.getById(project.id);
    expect(found.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it("removeTag updates updatedAt", async () => {
    const project = await projectRepository.create();
    await projectRepository.addTag({ id: project.id, name: "crochê" });
    const before = (await db.projects.get(project.id)).updatedAt;

    await projectRepository.removeTag({ id: project.id, name: "crochê" });

    const found = await projectRepository.getById(project.id);
    expect(found.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it("leaves updatedAt alone when the tag list does not change", async () => {
    const project = await projectRepository.create();
    await projectRepository.addTag({ id: project.id, name: "crochê" });
    const before = (await db.projects.get(project.id)).updatedAt;

    await projectRepository.addTag({ id: project.id, name: "CROCHÊ" });
    await projectRepository.removeTag({ id: project.id, name: "amigurumi" });

    const found = await db.projects.get(project.id);
    expect(found.updatedAt).toBe(before);
  });
});

describe("getAll with soft delete", () => {
  it("excludes soft-deleted projects", async () => {
    const p1 = await projectRepository.create();
    await projectRepository.create();
    await projectRepository.remove(p1.id);

    const projects = await projectRepository.getAll();
    expect(projects).toHaveLength(1);
  });
});

describe("getAllForSync", () => {
  it("returns all projects including soft-deleted", async () => {
    const p1 = await projectRepository.create();
    await projectRepository.create();
    await projectRepository.remove(p1.id);

    const all = await projectRepository.getAllForSync();
    expect(all).toHaveLength(2);
    expect(all.find((p) => p.id === p1.id).deletedAt).toBeTypeOf("number");
  });
});
