import Dexie from "dexie";
import { SYNC_PAIRED_KEY } from "@cronoz/shared";

const DB_NAME = "cronoz-db";
const LEGACY_SYNC_TOKEN_KEY = "syncToken";

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

db.version(4).stores({
  projects: "id, completedAt, createdAt, updatedAt, deletedAt",
  settings: "key",
  internal: "key",
});

db.version(5)
  .stores({
    projects: "id, completedAt, createdAt, updatedAt, deletedAt",
    settings: "key",
    internal: "key",
  })
  .upgrade((tx) => {
    return tx
      .table("projects")
      .toCollection()
      .modify((project) => {
        if (project.stopwatch && project.stopwatch.lastActiveAt === undefined) {
          project.stopwatch.lastActiveAt = null;
        }
      });
  });

// Being paired used to mean holding a sync token. The device secret replaced
// the token, so a device that held one keeps its pairing under the marker.
db.version(6)
  .stores({
    projects: "id, completedAt, createdAt, updatedAt, deletedAt",
    settings: "key",
    internal: "key",
  })
  .upgrade(async (tx) => {
    const internal = tx.table("internal");
    if (!(await internal.get(LEGACY_SYNC_TOKEN_KEY))) return;

    await internal.put({ key: SYNC_PAIRED_KEY, value: true });
    await internal.delete(LEGACY_SYNC_TOKEN_KEY);
  });

export default db;
