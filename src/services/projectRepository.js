const STORAGE_KEY = "cronoz-projects-db";

function getDefaultProject(id) {
  return {
    id,
    name: `Projeto #${id.substr(0, 4)}`,
    startTimestamp: null,
    totalTime: 0,
    laps: [],
    isRunning: false,
    createdAt: Date.now(),
  };
}

function getDB() {
  if (typeof window === "undefined") return {};

  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveDB(db) {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function getAll() {
  return Object.values(getDB());
}

function getById(id) {
  const db = getDB();
  return db[id] || null;
}

function save(project) {
  const db = getDB();
  db[project.id] = project;
  saveDB(db);
}

function create() {
  const id = crypto.randomUUID();
  const newProject = getDefaultProject(id);
  save(newProject);
  return newProject;
}

function rename({ id, name }) {
  const db = getDB();
  const project = db[id];

  if (!project) {
    console.error("Projeto não encontrado.");
    return;
  }

  save({ ...project, name });
}

function remove(id) {
  const db = getDB();
  delete db[id];
  saveDB(db);
}

function addLap({ id, time }) {
  const db = getDB();
  const project = db[id];

  if (!project) {
    console.error("Projeto não encontrado.");
    return;
  }

  const laps = project.laps || [];
  const name = `Lap #${laps.length + 1}`;
  const lapId = crypto.randomUUID();

  laps.unshift({ id: lapId, name, time });

  save({ ...project, laps });
}

function renameLap({ id, lapId, name }) {
  const db = getDB();
  const project = db[id];

  if (!project) {
    console.error("Projeto não encontrado.");
    return;
  }

  const laps = (project.laps || []).map((lap) =>
    lap.id === lapId ? { ...lap, name } : lap,
  );

  save({ ...project, laps });
}

function removeLap({ id, lapId }) {
  const db = getDB();
  const project = db[id];

  if (!project) {
    console.error("Projeto não encontrado.");
    return;
  }

  const laps = (project.laps || []).filter((lap) => lap.id !== lapId);

  save({ ...project, laps });
}

const projectRepository = {
  getAll,
  getById,
  save,
  create,
  rename,
  remove,
  addLap,
  renameLap,
  removeLap,
};

export default projectRepository;
