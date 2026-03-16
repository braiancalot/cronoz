import { describe, it, expect, beforeEach } from "vitest";
import db from "@/services/db.js";
import projectRepository, {
  DEFAULT_STOPWATCH,
} from "@/services/projectRepository.js";

beforeEach(async () => {
  await db.projects.clear();
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
  it("deletes the project", async () => {
    const project = await projectRepository.create();
    await projectRepository.remove(project.id);

    const found = await projectRepository.getById(project.id);
    expect(found).toBeNull();
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
  it("first lap has lapTime equal to totalTime", async () => {
    const project = await projectRepository.create();
    await projectRepository.addLap({ id: project.id, totalTime: 5000 });

    const found = await projectRepository.getById(project.id);
    const lap = found.stopwatch.laps[0];

    expect(lap.totalTime).toBe(5000);
    expect(lap.lapTime).toBe(5000);
    expect(lap.name).toBe("Lap #1");
  });

  it("second lap calculates difference from first", async () => {
    const project = await projectRepository.create();
    await projectRepository.addLap({ id: project.id, totalTime: 3000 });
    await projectRepository.addLap({ id: project.id, totalTime: 8000 });

    const found = await projectRepository.getById(project.id);
    const [secondLap, firstLap] = found.stopwatch.laps;

    expect(firstLap.totalTime).toBe(3000);
    expect(firstLap.lapTime).toBe(3000);
    expect(secondLap.totalTime).toBe(8000);
    expect(secondLap.lapTime).toBe(5000); // 8000 - 3000
    expect(secondLap.name).toBe("Lap #2");
  });

  it("does nothing for non-existent project", async () => {
    await expect(
      projectRepository.addLap({ id: "non-existent", totalTime: 1000 }),
    ).resolves.toBeUndefined();
  });
});

describe("renameLap", () => {
  it("renames a specific lap", async () => {
    const project = await projectRepository.create();
    await projectRepository.addLap({ id: project.id, totalTime: 5000 });

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
  it("removes a lap and recalculates lapTimes", async () => {
    const project = await projectRepository.create();
    await projectRepository.addLap({ id: project.id, totalTime: 2000 });
    await projectRepository.addLap({ id: project.id, totalTime: 5000 });
    await projectRepository.addLap({ id: project.id, totalTime: 9000 });

    // laps order (newest first): [9000, 5000, 2000]
    const before = await projectRepository.getById(project.id);
    const middleLapId = before.stopwatch.laps[1].id; // totalTime 5000

    await projectRepository.removeLap({ id: project.id, lapId: middleLapId });

    const found = await projectRepository.getById(project.id);
    expect(found.stopwatch.laps).toHaveLength(2);

    const [newest, oldest] = found.stopwatch.laps;
    expect(oldest.totalTime).toBe(2000);
    expect(oldest.lapTime).toBe(2000); // 2000 - 0
    expect(newest.totalTime).toBe(9000);
    expect(newest.lapTime).toBe(7000); // 9000 - 2000 (recalculated)
  });
});
