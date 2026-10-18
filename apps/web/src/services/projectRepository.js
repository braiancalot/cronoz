import db from "./db.js";
import { emitMutation } from "./repoEvents.js";
import { addTagToList, removeTagFromList } from "@/lib/tags.js";
import {
  appendLap,
  markLapDeleted,
  restoreLap,
} from "@/lib/stopwatchTransitions.js";

export const DEFAULT_STOPWATCH = {
  startTimestamp: null,
  currentLapTime: 0,
  isRunning: false,
  lastActiveAt: null,
  laps: [],
  realTime: 0,
  editedTime: 0,
};

function getDefaultProject(id) {
  const now = Date.now();
  return {
    id,
    name: `Projeto #${id.substr(0, 4)}`,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    tags: [],
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

// Read-modify-write of the stopwatch in one transaction, from the stored
// record rather than a caller's copy, which may lag behind a write that has
// not reached the live query yet. Writes nothing when the transform returns
// the same object. Bumps updatedAt and emits a mutation so the change reaches
// other devices via push.
async function updateStopwatch(id, transform) {
  let change = null;

  await db.transaction("rw", db.projects, async () => {
    const project = await db.projects.get(id);
    if (!project) return;

    const next = transform(project.stopwatch);
    if (next === project.stopwatch) return;

    await db.projects.update(id, { stopwatch: next, updatedAt: Date.now() });
    change = { previous: project.stopwatch, next };
  });

  if (change) emitMutation();
  return change;
}

async function addLap({ id, name }) {
  const now = Date.now();
  const lap = { id: crypto.randomUUID(), name, createdAt: now };
  return updateStopwatch(id, (sw) => appendLap(sw, lap, now));
}

async function renameLap({ id, lapId, name }) {
  await updateStopwatch(id, (sw) => ({
    ...sw,
    laps: sw.laps.map((lap) => (lap.id === lapId ? { ...lap, name } : lap)),
  }));
}

async function removeLap({ id, lapId }) {
  return updateStopwatch(id, (sw) => markLapDeleted(sw, lapId, Date.now()));
}

async function undeleteLap({ id, lapId }) {
  return updateStopwatch(id, (sw) => restoreLap(sw, lapId));
}

async function updateTags(id, transform) {
  let didChange = false;

  // Keep the read-modify-write inside one transaction. The tag manager can
  // dispatch another change before the previous promise settles; serialized
  // write transactions ensure the second transform sees the first result.
  await db.transaction("rw", db.projects, async () => {
    const project = await db.projects.get(id);
    if (!project) return;

    const tags = transform(project.tags);
    // The same list back means nothing to push to the other devices.
    if (tags === project.tags) return;

    await db.projects.update(id, { tags, updatedAt: Date.now() });
    didChange = true;
  });

  if (didChange) emitMutation();
}

async function addTag({ id, name }) {
  await updateTags(id, (tags) => addTagToList(tags, name));
}

async function removeTag({ id, name }) {
  await updateTags(id, (tags) => removeTagFromList(tags, name));
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
  addTag,
  removeTag,
  updateStopwatch,
};

export default projectRepository;
