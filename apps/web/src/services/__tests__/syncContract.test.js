import { describe, it, expect, beforeEach } from "vitest";
import { pushRequestSchema } from "@cronoz/shared";
import db from "@/services/db.js";
import projectRepository from "@/services/projectRepository.js";
import settingsRepository from "@/services/settingsRepository.js";
import {
  adjustCurrent,
  discardCurrent,
  pauseRun,
  startRun,
} from "@/lib/stopwatchTransitions.js";

const RUN_START = 1_000_000;

async function runFor(id, ms) {
  await projectRepository.updateStopwatch(id, (sw) =>
    pauseRun(startRun(sw, RUN_START), RUN_START + ms),
  );
}

async function addTimedLap(id, lapTime, name) {
  await runFor(id, lapTime);
  await projectRepository.addLap({ id, name });
}

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
    await addTimedLap(id, 5000, "Base");
    await addTimedLap(id, 3000, "Acabamento");
    await runFor(id, 1200);
    await projectRepository.updateStopwatch(id, (sw) =>
      startRun(sw, Date.now()),
    );
    await projectRepository.complete(id);

    const projects = await projectRepository.getAllForSync();
    expect(
      pushRequestSchema.parse({ projects, settings: [] }).projects,
    ).toEqual(projects);
  });

  it("keeps every field of a deleted project with a deleted lap", async () => {
    const { id } = await projectRepository.create();
    await projectRepository.addTag({ id, name: "Crochê" });
    await addTimedLap(id, 5000, "Base");

    const [lap] = (await db.projects.get(id)).stopwatch.laps;
    await projectRepository.renameLap({ id, lapId: lap.id, name: "Revisado" });
    await projectRepository.removeLap({ id, lapId: lap.id });
    await projectRepository.remove(id);

    const projects = await projectRepository.getAllForSync();
    expect(
      pushRequestSchema.parse({ projects, settings: [] }).projects,
    ).toEqual(projects);
  });

  it("keeps the real and edited time after adjusts and a discard", async () => {
    const { id } = await projectRepository.create();
    await addTimedLap(id, 5000, "Base");
    await runFor(id, 2000);
    await projectRepository.updateStopwatch(id, (sw) =>
      adjustCurrent(sw, 60_000, Date.now()),
    );
    await addTimedLap(id, 0, "Ajustada");
    await runFor(id, 700);
    await projectRepository.updateStopwatch(id, (sw) =>
      discardCurrent(sw, Date.now()),
    );

    const projects = await projectRepository.getAllForSync();
    const [pushed] = pushRequestSchema.parse({
      projects,
      settings: [],
    }).projects;
    expect(pushed.stopwatch.realTime).toBe(7700);
    expect(pushed.stopwatch.editedTime).toBe(58_000 - 700);
    expect(pushed).toEqual(projects[0]);
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
