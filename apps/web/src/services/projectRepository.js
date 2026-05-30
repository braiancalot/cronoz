import db from "./db.js";
import { emitMutation } from "./repoEvents.js";

export const DEFAULT_STOPWATCH = {
  startTimestamp: null,
  currentLapTime: 0,
  isRunning: false,
  lastActiveAt: null,
  laps: [],
};

function getDefaultProject(id) {
  const now = Date.now();
  return {
    id,
    name: `Projeto #${id.substr(0, 4)}`,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    stopwatch: { ...DEFAULT_STOPWATCH },
  };
}

function filterDeletedLaps(project) {
  if (!project?.stopwatch?.laps) return project;
  return {
    ...project,
    stopwatch: {
      ...project.stopwatch,
      laps: project.stopwatch.laps.filter((lap) => !lap.deletedAt),
    },
  };
}

async function getRawById(id) {
  return (await db.projects.get(id)) ?? null;
}

// Helper for local mutations: bumps updatedAt and emits a mutation event.
async function mutateLocal(id, changes) {
  await db.projects.update(id, { ...changes, updatedAt: Date.now() });
  emitMutation();
}

async function getAll() {
  const projects = await db.projects.filter((p) => !p.deletedAt).toArray();
  return projects.map(filterDeletedLaps);
}

async function getById(id) {
  const project = await getRawById(id);
  if (!project || project.deletedAt) return null;
  return filterDeletedLaps(project);
}

async function getAllForSync() {
  return db.projects.toArray();
}

// Apply an incoming record from the sync pull. No event, no updatedAt
// rewrite — the incoming updatedAt is the source of truth for LWW.
async function applyFromSync(project) {
  await db.projects.put(project);
}

async function create() {
  const id = crypto.randomUUID();
  const project = getDefaultProject(id);
  await db.projects.put(project);
  emitMutation();
  return project;
}

async function rename({ id, newName }) {
  await mutateLocal(id, { name: newName });
}

async function remove(id) {
  await mutateLocal(id, { deletedAt: Date.now() });
}

async function undeleteProject(id) {
  await mutateLocal(id, { deletedAt: null });
}

async function complete(id) {
  await mutateLocal(id, { completedAt: Date.now() });
}

async function reopen(id) {
  await mutateLocal(id, { completedAt: null });
}

async function addLap({ id, lapTime, name }) {
  const project = await getRawById(id);
  if (!project) return;

  const newLap = {
    id: crypto.randomUUID(),
    name,
    lapTime,
    createdAt: Date.now(),
  };

  await mutateLocal(id, {
    stopwatch: {
      ...project.stopwatch,
      currentLapTime: 0,
      laps: [newLap, ...project.stopwatch.laps],
    },
  });
}

async function renameLap({ id, lapId, name }) {
  const project = await getRawById(id);
  if (!project) return;

  const laps = project.stopwatch.laps.map((lap) =>
    lap.id === lapId ? { ...lap, name } : lap,
  );

  await mutateLocal(id, {
    stopwatch: { ...project.stopwatch, laps },
  });
}

async function removeLap({ id, lapId }) {
  const project = await getRawById(id);
  if (!project) return;

  const now = Date.now();
  const laps = project.stopwatch.laps.map((lap) =>
    lap.id === lapId ? { ...lap, deletedAt: now } : lap,
  );

  await mutateLocal(id, {
    stopwatch: { ...project.stopwatch, laps },
  });
}

async function undeleteLap({ id, lapId }) {
  const project = await getRawById(id);
  if (!project) return;

  const laps = project.stopwatch.laps.map((lap) =>
    lap.id === lapId ? { ...lap, deletedAt: null } : lap,
  );

  await mutateLocal(id, {
    stopwatch: { ...project.stopwatch, laps },
  });
}

// User-final stopwatch transitions (start/pause/reset/recovery). Unlike
// save(), this bumps updatedAt and emits a mutation event so the change
// reaches other devices via push.
async function setStopwatch(id, stopwatch) {
  await mutateLocal(id, { stopwatch });
}

const projectRepository = {
  getAll,
  getById,
  getAllForSync,
  applyFromSync,
  create,
  rename,
  remove,
  undeleteProject,
  complete,
  reopen,
  addLap,
  renameLap,
  removeLap,
  undeleteLap,
  setStopwatch,
};

export default projectRepository;
