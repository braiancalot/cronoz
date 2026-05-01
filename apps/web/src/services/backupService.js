import db from "./db.js";

export const SCHEMA_VERSION = 1;

export class BackupError extends Error {
  constructor(message, { code } = {}) {
    super(message);
    this.name = "BackupError";
    this.code = code;
  }
}

async function exportData() {
  const projects = await db.projects.toArray();
  const settings = await db.settings.toArray();
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: Date.now(),
    projects,
    settings,
  };
}

function parseBackup(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BackupError("Arquivo inválido: não é um JSON.", {
      code: "invalid_json",
    });
  }
  if (!parsed || typeof parsed !== "object") {
    throw new BackupError("Arquivo inválido.", { code: "invalid_shape" });
  }
  if (parsed.schemaVersion !== SCHEMA_VERSION) {
    throw new BackupError(
      `Versão de backup não suportada (${parsed.schemaVersion}).`,
      { code: "unsupported_version" },
    );
  }
  if (!Array.isArray(parsed.projects) || !Array.isArray(parsed.settings)) {
    throw new BackupError("Arquivo inválido: estrutura ausente.", {
      code: "invalid_shape",
    });
  }
  return parsed;
}

// Replace semantics: clear local data, then bulk-write the backup as-is.
// Wrapped in a single Dexie transaction so a failure mid-way leaves the
// DB untouched. Does not touch db.internal — pairing/device state stays.
async function applyBackup(data) {
  await db.transaction("rw", db.projects, db.settings, async () => {
    await db.projects.clear();
    await db.settings.clear();
    if (data.projects.length > 0) await db.projects.bulkPut(data.projects);
    if (data.settings.length > 0) await db.settings.bulkPut(data.settings);
  });
}

const backupService = { exportData, parseBackup, applyBackup };
export default backupService;
