import {
  LAST_PUSHED_AT_KEY,
  LAST_SYNCED_AT_KEY,
  SYNC_CURSOR_KEY,
  SYNC_TOKEN_KEY,
} from "@cronoz/shared";
import db from "./db.js";
import deviceService from "./deviceService.js";
import internalRepository from "./internalRepository.js";
import projectRepository from "./projectRepository.js";
import { onMutation } from "./repoEvents.js";
import settingsRepository from "./settingsRepository.js";
import syncService, { SyncError } from "./syncService.js";
import { pickLatestProject, pickLatestSetting } from "./syncMerge.js";

const DEBOUNCE_MS = 2000;

let inFlight = null;
let debounceTimer = null;
let unsubscribeMutations = null;

let status = { syncing: false, error: null };
const statusListeners = new Set();

function notifyStatus() {
  for (const listener of statusListeners) listener();
}

function setStatus(updates) {
  status = { ...status, ...updates };
  notifyStatus();
}

function getStatus() {
  return status;
}

function subscribe(listener) {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

async function isPaired() {
  const token = await internalRepository.get(SYNC_TOKEN_KEY);
  return !!token;
}

async function callAuthed(makeRequest) {
  const token = await internalRepository.get(SYNC_TOKEN_KEY);
  try {
    return await makeRequest(token);
  } catch (err) {
    if (!(err instanceof SyncError) || err.status !== 401) throw err;

    const deviceId = await deviceService.getOrCreateDeviceId();
    try {
      const { token: newToken } = await syncService.refreshToken({ deviceId });
      await internalRepository.set(SYNC_TOKEN_KEY, newToken);
      return await makeRequest(newToken);
    } catch (refreshErr) {
      if (refreshErr instanceof SyncError && refreshErr.status === 404) {
        await internalRepository.remove(SYNC_TOKEN_KEY);
      }
      throw refreshErr;
    }
  }
}

// NOTE: lastPushedAt is a server timestamp, while a record's updatedAt is a
// client timestamp. Significant clock skew between client and server can let
// recent local edits slip past the (updatedAt > lastPushedAt) filter, or
// cause already-pushed records to be re-pushed. Acceptable for personal use
// (1–2 devices); revisit if it becomes a real problem.
async function pushLocalChanges() {
  const lastPushedAt = (await internalRepository.get(LAST_PUSHED_AT_KEY)) ?? 0;

  const allProjects = await projectRepository.getAllForSync();
  const projectsToPush = allProjects.filter(
    (p) => (p.updatedAt ?? 0) > lastPushedAt,
  );

  const allSettings = await settingsRepository.getAll();
  const settingsToPush = allSettings.filter(
    (s) => (s.updatedAt ?? 0) > lastPushedAt,
  );

  if (projectsToPush.length === 0 && settingsToPush.length === 0) return;

  const { serverTimestamp } = await callAuthed((t) =>
    syncService.push({
      token: t,
      projects: projectsToPush,
      settings: settingsToPush,
    }),
  );
  await internalRepository.set(LAST_PUSHED_AT_KEY, serverTimestamp);
}

async function pullRemoteChanges() {
  const cursor = (await internalRepository.get(SYNC_CURSOR_KEY)) ?? 0;
  const {
    projects: incomingProjects,
    settings: incomingSettings,
    cursor: newCursor,
  } = await callAuthed((t) => syncService.pull({ token: t, cursor }));

  for (const incoming of incomingProjects) {
    const existing = (await db.projects.get(incoming.id)) ?? null;
    if (pickLatestProject(incoming, existing) === incoming) {
      await projectRepository.applyFromSync(incoming);
    }
  }

  for (const incoming of incomingSettings) {
    const existing = (await db.settings.get(incoming.key)) ?? null;
    if (pickLatestSetting(incoming, existing) === incoming) {
      await settingsRepository.applyFromSync(incoming);
    }
  }

  await internalRepository.set(SYNC_CURSOR_KEY, newCursor);
}

async function runSync() {
  const token = await internalRepository.get(SYNC_TOKEN_KEY);
  if (!token) return;

  setStatus({ syncing: true, error: null });

  try {
    await pushLocalChanges();
    await pullRemoteChanges();
    await internalRepository.set(LAST_SYNCED_AT_KEY, Date.now());
    setStatus({ syncing: false, error: null });
  } catch (err) {
    if (err instanceof SyncError && err.status === 401) {
      await internalRepository.remove(SYNC_TOKEN_KEY);
      setStatus({ syncing: false, error: null });
      return;
    }
    if (err instanceof SyncError) {
      console.warn("[syncManager] sync failed:", err.message, err.body);
      setStatus({ syncing: false, error: err.message });
      return;
    }
    setStatus({ syncing: false, error: "unknown_error" });
    throw err;
  }
}

function sync() {
  if (inFlight) return inFlight;
  inFlight = runSync().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

function scheduleSync() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    sync();
  }, DEBOUNCE_MS);
}

// Idempotent: extra start() calls without a prior stop are no-ops, so a
// double-mounted hook can't leak listeners. The returned function tears
// down the subscription and resets state.
function start() {
  if (unsubscribeMutations) return unsubscribeMutations;
  const off = onMutation(scheduleSync);
  unsubscribeMutations = () => {
    off();
    unsubscribeMutations = null;
  };
  return unsubscribeMutations;
}

async function unpair() {
  const token = await internalRepository.get(SYNC_TOKEN_KEY);
  if (token) {
    try {
      await syncService.leaveGroup({ token });
    } catch (err) {
      console.warn("[syncManager] leaveGroup failed:", err?.message);
    }
  }
  await internalRepository.remove(SYNC_TOKEN_KEY);
  await internalRepository.remove(SYNC_CURSOR_KEY);
  await internalRepository.remove(LAST_PUSHED_AT_KEY);
  await internalRepository.remove(LAST_SYNCED_AT_KEY);
}

async function getDeviceCount() {
  const token = await internalRepository.get(SYNC_TOKEN_KEY);
  if (!token) return null;
  try {
    const { count } = await syncService.getDeviceCount({ token });
    return count;
  } catch {
    return null;
  }
}

const syncManager = {
  isPaired,
  sync,
  scheduleSync,
  start,
  unpair,
  subscribe,
  getStatus,
  getDeviceCount,
};
export default syncManager;
