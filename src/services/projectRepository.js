const STORAGE_KEY = "cronoz-projects-db";

function getDefaultProject(id) {
  return {
    id,
    name: `Projeto #${id.substr(0, 4)}`,
    startTimestamp: null,
    totalTime: 0,
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

const projectRepository = {
  getAll,
  getById,
  save,
  create,
};

export default projectRepository;
