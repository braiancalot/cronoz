import {
  LAST_PUSHED_AT_KEY,
  LAST_SYNCED_AT_KEY,
  MAX_PUSH_PROJECTS,
  SYNC_CURSOR_KEY,
  SYNC_PAIRED_KEY,
  SYNC_REVOKED_KEY,
} from "@cronoz/shared";
import db from "./db.js";
import deviceService from "./deviceService.js";
import internalRepository from "./internalRepository.js";
import projectRepository from "./projectRepository.js";
import { onMutation } from "./repoEvents.js";
import settingsRepository from "./settingsRepository.js";
import syncService, { SyncError } from "./syncService.js";
import { pickLatestProject, pickLatestSetting } from "./syncMerge.js";
import { splitPushBatches } from "@/lib/pushBatches.js";

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
  return !!(await internalRepository.get(SYNC_PAIRED_KEY));
}

// The server no longer knows this device: someone unpaired it from elsewhere.
async function dropRevokedPairing() {
  await internalRepository.remove(SYNC_PAIRED_KEY);
  await internalRepository.set(SYNC_REVOKED_KEY, true);
}

async function adoptPairing() {
  await internalRepository.set(SYNC_PAIRED_KEY, true);
  await internalRepository.remove(SYNC_REVOKED_KEY);
  sync();
}

// lastPushedAt is a server timestamp, updatedAt a client one: clock skew can
// let a local edit slip past the (updatedAt > lastPushedAt) filter, or re-push
// a record. Acceptable for 1–2 personal devices; revisit if it bites.
async function pushLocalChanges(credential) {
  const lastPushedAt = (await internalRepository.get(LAST_PUSHED_AT_KEY)) ?? 0;
  const pending = await collectPendingChanges(lastPushedAt);
  if (pending.projects.length === 0 && pending.settings.length === 0) return;

  const batches = splitPushBatches({
    ...pending,
    batchSize: MAX_PUSH_PROJECTS,
  });
  const pushedAt = await pushBatches(batches, credential);
  await internalRepository.set(LAST_PUSHED_AT_KEY, pushedAt);
}

async function collectPendingChanges(lastPushedAt) {
  const isPending = (record) => (record.updatedAt ?? 0) > lastPushedAt;
  const projects = await projectRepository.getAllForSync();
  const settings = await settingsRepository.getAll();
  return {
    projects: projects.filter(isPending),
    settings: settings.filter(isPending),
  };
}

// Returns the first batch's timestamp, so an edit made while later batches
// were in flight still counts as newer next time.
async function pushBatches(batches, credential) {
  let pushedAt = null;
  for (const batch of batches) {
    const { serverTimestamp } = await syncService.push({
      credential,
      ...batch,
    });
    pushedAt ??= serverTimestamp;
  }
  return pushedAt;
}

async function pullRemoteChanges(credential) {
  const cursor = (await internalRepository.get(SYNC_CURSOR_KEY)) ?? 0;
  const {
    projects: incomingProjects,
    settings: incomingSettings,
    cursor: newCursor,
  } = await syncService.pull({ credential, cursor });

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
  if (!(await isPaired())) return;

  setStatus({ syncing: true, error: null });

  try {
    const credential = await deviceService.getDeviceCredential();
    await pushLocalChanges(credential);
    await pullRemoteChanges(credential);
    await internalRepository.set(LAST_SYNCED_AT_KEY, Date.now());
    setStatus({ syncing: false, error: null });
  } catch (err) {
    if (err instanceof SyncError && err.status === 401) {
      await dropRevokedPairing();
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

async function leaveGroupQuietly() {
  try {
    const credential = await deviceService.getDeviceCredential();
    await syncService.leaveGroup({ credential });
  } catch (err) {
    console.warn("[syncManager] leaveGroup failed:", err?.message);
  }
}

async function unpair() {
  if (await isPaired()) await leaveGroupQuietly();
  await internalRepository.remove(SYNC_PAIRED_KEY);
  await internalRepository.remove(SYNC_CURSOR_KEY);
  await internalRepository.remove(LAST_PUSHED_AT_KEY);
  await internalRepository.remove(LAST_SYNCED_AT_KEY);
  await internalRepository.remove(SYNC_REVOKED_KEY);
}

async function getDeviceCount() {
  if (!(await isPaired())) return null;
  try {
    const credential = await deviceService.getDeviceCredential();
    const { count } = await syncService.getDeviceCount({ credential });
    return count;
  } catch {
    return null;
  }
}

const syncManager = {
  isPaired,
  adoptPairing,
  sync,
  scheduleSync,
  start,
  unpair,
  subscribe,
  getStatus,
  getDeviceCount,
};
export default syncManager;
