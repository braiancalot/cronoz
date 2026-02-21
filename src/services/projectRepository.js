import db from "./db.js";

export const DEFAULT_STOPWATCH = {
  startTimestamp: null,
  totalTime: 0,
  isRunning: false,
  laps: [],
};

function getDefaultProject(id) {
  return {
    id,
    name: `Projeto #${id.substr(0, 4)}`,
    completedAt: null,
    createdAt: Date.now(),
    stopwatch: { ...DEFAULT_STOPWATCH },
  };
}

async function getAll() {
  return db.projects.toArray();
}

async function getById(id) {
  return (await db.projects.get(id)) ?? null;
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
  await db.projects.update(id, { name: newName });
}

async function remove(id) {
  await db.projects.delete(id);
}

async function complete(id) {
  await db.projects.update(id, { completedAt: Date.now() });
}

async function reopen(id) {
  await db.projects.update(id, { completedAt: null });
}

async function addLap({ id, totalTime }) {
  const project = await getById(id);
  if (!project) return;

  const laps = project.stopwatch.laps;
  const lastLapTime = laps.length > 0 ? laps[0].totalTime : 0;

  const newLap = {
    id: crypto.randomUUID(),
    name: `Lap #${laps.length + 1}`,
    totalTime,
    lapTime: totalTime - lastLapTime,
    createdAt: Date.now(),
  };

  await db.projects.update(id, {
    stopwatch: {
      ...project.stopwatch,
      laps: [newLap, ...laps],
    },
  });
}

async function renameLap({ id, lapId, name }) {
  const project = await getById(id);
  if (!project) return;

  const laps = project.stopwatch.laps.map((lap) =>
    lap.id === lapId ? { ...lap, name } : lap,
  );

  await db.projects.update(id, {
    stopwatch: { ...project.stopwatch, laps },
  });
}

async function removeLap({ id, lapId }) {
  const project = await getById(id);
  if (!project) return;

  const laps = project.stopwatch.laps.filter((lap) => lap.id !== lapId);

  const recalculated = laps.map((lap, index) => {
    const older = laps[index + 1];
    return { ...lap, lapTime: lap.totalTime - (older?.totalTime ?? 0) };
  });

  await db.projects.update(id, {
    stopwatch: { ...project.stopwatch, laps: recalculated },
  });
}

const projectRepository = {
  getAll,
  getById,
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
