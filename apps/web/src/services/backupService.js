import { projectSchema, settingSchema } from "@cronoz/shared";
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

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    throw new BackupError("Arquivo inválido: não é um JSON.", {
      code: "invalid_json",
    });
  }
}

function assertBackupEnvelope(parsed) {
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
}

function invalidRecordError({ label, index, fieldPath }) {
  const field = fieldPath.length > 0 ? `, campo ${fieldPath.join(".")}` : "";
  return new BackupError(`Arquivo inválido: ${label} ${index + 1}${field}.`, {
    code: "invalid_shape",
  });
}

// Returns Zod's output, which drops the keys the schema does not declare.
function validateRecords(records, { label, schema }) {
  return records.map((record, index) => {
    const result = schema.safeParse(record);
    if (result.success) return result.data;
    const fieldPath = result.error.issues[0].path;
    throw invalidRecordError({ label, index, fieldPath });
  });
}

// A record the push schema refuses would fail every push from then on, so
// the import holds the same schemas the API does.
function parseBackup(text) {
  const parsed = parseJson(text);
  assertBackupEnvelope(parsed);
  return {
    schemaVersion: parsed.schemaVersion,
    exportedAt: parsed.exportedAt,
    projects: validateRecords(parsed.projects, {
      label: "projeto",
      schema: projectSchema,
    }),
    settings: validateRecords(parsed.settings, {
      label: "configuração",
      schema: settingSchema,
    }),
  };
}

// Replace semantics: clear local data, then bulk-write the parsed backup.
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
