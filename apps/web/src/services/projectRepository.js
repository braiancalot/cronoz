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

// Raw write: no updatedAt bump, no mutation event. Used by hot/transient
// flows like the running-stopwatch checkpoint, where syncing every 10s
// would be wasteful.
async function save(project) {
  await db.projects.put(project);
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

const projectRepository = {
  getAll,
  getById,
  getAllForSync,
  save,
  applyFromSync,
  create,
  rename,
  remove,
  complete,
  reopen,
  addLap,
  renameLap,
  removeLap,
};

export default projectRepository;
