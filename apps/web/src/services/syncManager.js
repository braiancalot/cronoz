import {
  LAST_PUSHED_AT_KEY,
  SYNC_CURSOR_KEY,
  SYNC_TOKEN_KEY,
} from "@cronoz/shared";
import db from "./db.js";
import internalRepository from "./internalRepository.js";
import projectRepository from "./projectRepository.js";
import settingsRepository from "./settingsRepository.js";
import syncService, { SyncError } from "./syncService.js";
import { pickLatestProject, pickLatestSetting } from "./syncMerge.js";

const DEBOUNCE_MS = 2000;

let inFlight = null;
let debounceTimer = null;

async function isPaired() {
  const token = await internalRepository.get(SYNC_TOKEN_KEY);
  return !!token;
}

async function runSync() {
  const token = await internalRepository.get(SYNC_TOKEN_KEY);
  if (!token) return;

  try {
    const lastPushedAt =
      (await internalRepository.get(LAST_PUSHED_AT_KEY)) ?? 0;

    const allProjects = await projectRepository.getAllForSync();
    const projectsToPush = allProjects.filter(
      (p) => (p.updatedAt ?? 0) > lastPushedAt,
    );

    const allSettings = await settingsRepository.getAll();
    const settingsToPush = allSettings.filter(
      (s) => (s.updatedAt ?? 0) > lastPushedAt,
    );

    if (projectsToPush.length > 0 || settingsToPush.length > 0) {
      const { serverTimestamp } = await syncService.push({
        token,
        projects: projectsToPush,
        settings: settingsToPush,
      });
      await internalRepository.set(LAST_PUSHED_AT_KEY, serverTimestamp);
    }

    const cursor = (await internalRepository.get(SYNC_CURSOR_KEY)) ?? 0;
    const {
      projects: incomingProjects,
      settings: incomingSettings,
      cursor: newCursor,
    } = await syncService.pull({ token, cursor });

    for (const incoming of incomingProjects) {
      const existing = (await db.projects.get(incoming.id)) ?? null;
      if (pickLatestProject(incoming, existing) === incoming) {
        await projectRepository.save(incoming);
      }
    }

    for (const incoming of incomingSettings) {
      const existing = (await db.settings.get(incoming.key)) ?? null;
      if (pickLatestSetting(incoming, existing) === incoming) {
        await settingsRepository.upsertFromSync(incoming);
      }
    }

    await internalRepository.set(SYNC_CURSOR_KEY, newCursor);
  } catch (err) {
    if (err instanceof SyncError && err.status === 401) {
      await internalRepository.remove(SYNC_TOKEN_KEY);
      return;
    }
    if (err instanceof SyncError) {
      console.warn("[syncManager] sync failed:", err.message, err.body);
      return;
    }
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

function scheduleSync(_reason) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    sync();
  }, DEBOUNCE_MS);
}

const syncManager = { isPaired, sync, scheduleSync };
export default syncManager;
