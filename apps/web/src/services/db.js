import Dexie from "dexie";

const DB_NAME = "cronoz-db";
const DB_VERSION = 1;

const db = new Dexie(DB_NAME);

db.version(DB_VERSION).stores({
  projects: "id, completedAt, createdAt",
  settings: "key",
});

export default db;
