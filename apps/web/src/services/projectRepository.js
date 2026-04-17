import db from "./db.js";

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

async function getAll() {
  const projects = await db.projects.filter((p) => !p.deletedAt).toArray();
  return projects.map(filterDeletedLaps);
}

async function getById(id) {
  const project = (await db.projects.get(id)) ?? null;
  if (!project || project.deletedAt) return null;
  return filterDeletedLaps(project);
}

async function getAllForSync() {
  return db.projects.toArray();
}

async function save(project) {
  await db.projects.put(project);
}

async function create() {
  const id = crypto.randomUUID();
  const project = getDefaultProject(id);
  await save(project);
  return project;
}

async function rename({ id, newName }) {
  await db.projects.update(id, { name: newName, updatedAt: Date.now() });
}

async function remove(id) {
  const now = Date.now();
  await db.projects.update(id, { deletedAt: now, updatedAt: now });
}

async function complete(id) {
  const now = Date.now();
  await db.projects.update(id, { completedAt: now, updatedAt: now });
}

async function reopen(id) {
  await db.projects.update(id, { completedAt: null, updatedAt: Date.now() });
}

async function getRawById(id) {
  return (await db.projects.get(id)) ?? null;
}

async function addLap({ id, lapTime, name }) {
  const project = await getRawById(id);
  if (!project) return;

  const laps = project.stopwatch.laps;

  const newLap = {
    id: crypto.randomUUID(),
    name,
    lapTime,
    createdAt: Date.now(),
  };

  await db.projects.update(id, {
    updatedAt: Date.now(),
    stopwatch: {
      ...project.stopwatch,
      currentLapTime: 0,
      laps: [newLap, ...laps],
    },
  });
}

async function renameLap({ id, lapId, name }) {
  const project = await getRawById(id);
  if (!project) return;

  const laps = project.stopwatch.laps.map((lap) =>
    lap.id === lapId ? { ...lap, name } : lap,
  );

  await db.projects.update(id, {
    updatedAt: Date.now(),
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

  await db.projects.update(id, {
    updatedAt: now,
    stopwatch: { ...project.stopwatch, laps },
  });
}

const projectRepository = {
  getAll,
  getById,
  getAllForSync,
  save,
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
