import { describe, it, expect, beforeEach } from "vitest";
import { pushRequestSchema } from "@cronoz/shared";
import db from "@/services/db.js";
import projectRepository from "@/services/projectRepository.js";
import settingsRepository from "@/services/settingsRepository.js";

beforeEach(async () => {
  await db.projects.clear();
  await db.settings.clear();
});

// The push schema drops keys it does not declare, so a field added to the
// local record stops syncing with no error anywhere. Hand-written fixtures
// cannot catch that — these records come from the real repositories.
describe("sync contract: local records survive the push schema", () => {
  it("keeps every field of a completed project with tags and laps", async () => {
    const { id } = await projectRepository.create();
    await projectRepository.rename({ id, newName: "Cliente X" });
    await projectRepository.addTag({ id, name: "Crochê" });
    await projectRepository.addTag({ id, name: "Urgente" });
    await projectRepository.addLap({ id, lapTime: 5000, name: "Base" });
    await projectRepository.addLap({ id, lapTime: 3000, name: "Acabamento" });

    const { stopwatch } = await db.projects.get(id);
    await projectRepository.setStopwatch(id, {
      ...stopwatch,
      startTimestamp: Date.now(),
      currentLapTime: 1200,
      isRunning: true,
      lastActiveAt: Date.now(),
    });
    await projectRepository.complete(id);

    const projects = await projectRepository.getAllForSync();
    expect(
      pushRequestSchema.parse({ projects, settings: [] }).projects,
    ).toEqual(projects);
  });

  it("keeps every field of a deleted project with a deleted lap", async () => {
    const { id } = await projectRepository.create();
    await projectRepository.addTag({ id, name: "Crochê" });
    await projectRepository.addLap({ id, lapTime: 5000, name: "Base" });

    const [lap] = (await db.projects.get(id)).stopwatch.laps;
    await projectRepository.renameLap({ id, lapId: lap.id, name: "Revisado" });
    await projectRepository.removeLap({ id, lapId: lap.id });
    await projectRepository.remove(id);

    const projects = await projectRepository.getAllForSync();
    expect(
      pushRequestSchema.parse({ projects, settings: [] }).projects,
    ).toEqual(projects);
  });

  it("keeps every field of the settings the repository writes", async () => {
    await settingsRepository.set("hourlyPrice", 42);
    await settingsRepository.set("ignoreMilliseconds", true);
    await settingsRepository.set("hideTags", false);

    const settings = await settingsRepository.getAll();
    expect(
      pushRequestSchema.parse({ projects: [], settings }).settings,
    ).toEqual(settings);
  });
});
