import Dexie from "dexie";

const DB_NAME = "cronoz-db";

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

export default db;
