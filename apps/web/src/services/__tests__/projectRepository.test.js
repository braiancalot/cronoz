import { describe, it, expect, beforeEach } from "vitest";
import db from "@/services/db.js";
import projectRepository, {
  DEFAULT_STOPWATCH,
} from "@/services/projectRepository.js";

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
    });
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

describe("save", () => {
  it("updates an existing project", async () => {
    const project = await projectRepository.create();
    project.name = "Updated";

    await projectRepository.save(project);
    const found = await projectRepository.getById(project.id);

    expect(found.name).toBe("Updated");
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
  it("saves lap with lapTime and resets currentLapTime", async () => {
    const project = await projectRepository.create();

    // Simulate a running stopwatch with accumulated time
    await projectRepository.save({
      ...project,
      stopwatch: {
        ...project.stopwatch,
        isRunning: true,
        startTimestamp: 1000,
        currentLapTime: 0,
      },
    });

    await projectRepository.addLap({
      id: project.id,
      lapTime: 5000,
      name: "Etapa #1",
    });

    const found = await projectRepository.getById(project.id);
    const lap = found.stopwatch.laps[0];

    expect(lap.lapTime).toBe(5000);
    expect(lap.name).toBe("Etapa #1");
    expect(lap.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(lap.createdAt).toBeTypeOf("number");
    expect(found.stopwatch.currentLapTime).toBe(0);
    expect(found.stopwatch.startTimestamp).toBe(1000); // preserves original value
  });

  it("adds multiple laps each with their own lapTime", async () => {
    const project = await projectRepository.create();

    await projectRepository.addLap({
      id: project.id,
      lapTime: 3000,
      name: "Etapa #1",
    });
    await projectRepository.addLap({
      id: project.id,
      lapTime: 5000,
      name: "Etapa #2",
    });

    const found = await projectRepository.getById(project.id);
    const [secondLap, firstLap] = found.stopwatch.laps;

    expect(firstLap.lapTime).toBe(3000);
    expect(firstLap.name).toBe("Etapa #1");
    expect(secondLap.lapTime).toBe(5000);
    expect(secondLap.name).toBe("Etapa #2");
  });

  it("does nothing for non-existent project", async () => {
    await expect(
      projectRepository.addLap({
        id: "non-existent",
        lapTime: 1000,
        name: "Etapa #1",
      }),
    ).resolves.toBeUndefined();
  });
});

describe("renameLap", () => {
  it("renames a specific lap", async () => {
    const project = await projectRepository.create();
    await projectRepository.addLap({
      id: project.id,
      lapTime: 5000,
      name: "Etapa #1",
    });

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
    await projectRepository.addLap({
      id: project.id,
      lapTime: 2000,
      name: "Etapa #1",
    });
    await projectRepository.addLap({
      id: project.id,
      lapTime: 3000,
      name: "Etapa #2",
    });
    await projectRepository.addLap({
      id: project.id,
      lapTime: 4000,
      name: "Etapa #3",
    });

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

    await projectRepository.addLap({
      id: project.id,
      lapTime: 5000,
      name: "Etapa #1",
    });
    const found = await projectRepository.getById(project.id);
    expect(found.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it("renameLap updates updatedAt", async () => {
    const project = await projectRepository.create();
    await projectRepository.addLap({
      id: project.id,
      lapTime: 5000,
      name: "Etapa #1",
    });
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
    await projectRepository.addLap({
      id: project.id,
      lapTime: 5000,
      name: "Etapa #1",
    });
    const withLap = await projectRepository.getById(project.id);
    const before = withLap.updatedAt;

    await projectRepository.removeLap({
      id: project.id,
      lapId: withLap.stopwatch.laps[0].id,
    });
    const found = await projectRepository.getById(project.id);
    expect(found.updatedAt).toBeGreaterThanOrEqual(before);
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
