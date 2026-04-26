import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  LAST_PUSHED_AT_KEY,
  LAST_SYNCED_AT_KEY,
  SYNC_CURSOR_KEY,
  SYNC_TOKEN_KEY,
} from "@cronoz/shared";

vi.mock("@/services/syncService.js", async () => {
  const actual = await vi.importActual("@/services/syncService.js");
  return {
    ...actual,
    default: {
      pairInitiate: vi.fn(),
      pairJoin: vi.fn(),
      refreshToken: vi.fn(),
      push: vi.fn(),
      pull: vi.fn(),
      getDeviceCount: vi.fn(),
    },
  };
});

import db from "@/services/db.js";
import internalRepository from "@/services/internalRepository.js";
import syncService from "@/services/syncService.js";
import { useSyncStatus } from "@/hooks/useSyncStatus.js";

beforeEach(async () => {
  await db.internal.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useSyncStatus", () => {
  it("reports not paired when no token", async () => {
    const { result } = renderHook(() => useSyncStatus());
    await waitFor(() => expect(result.current.isPaired).toBe(false));
    expect(result.current.deviceCount).toBeNull();
    expect(result.current.lastSyncedAt).toBeNull();
  });

  it("reports paired and fetches deviceCount when token is set", async () => {
    await internalRepository.set(SYNC_TOKEN_KEY, "tok");
    syncService.getDeviceCount.mockResolvedValue({ count: 2 });

    const { result } = renderHook(() => useSyncStatus());
    await waitFor(() => expect(result.current.isPaired).toBe(true));
    await waitFor(() => expect(result.current.deviceCount).toBe(2));
    expect(syncService.getDeviceCount).toHaveBeenCalledWith({ token: "tok" });
  });

  it("exposes lastSyncedAt from internal", async () => {
    await internalRepository.set(SYNC_TOKEN_KEY, "tok");
    await internalRepository.set(LAST_SYNCED_AT_KEY, 12345);
    syncService.getDeviceCount.mockResolvedValue({ count: 1 });

    const { result } = renderHook(() => useSyncStatus());
    await waitFor(() => expect(result.current.lastSyncedAt).toBe(12345));
  });

  it("unpair clears all sync-related internal keys", async () => {
    await internalRepository.set(SYNC_TOKEN_KEY, "tok");
    await internalRepository.set(SYNC_CURSOR_KEY, 1000);
    await internalRepository.set(LAST_PUSHED_AT_KEY, 2000);
    await internalRepository.set(LAST_SYNCED_AT_KEY, 3000);
    syncService.getDeviceCount.mockResolvedValue({ count: 1 });

    const { result } = renderHook(() => useSyncStatus());
    await waitFor(() => expect(result.current.isPaired).toBe(true));

    await result.current.unpair();

    await waitFor(() => expect(result.current.isPaired).toBe(false));
    expect(await internalRepository.get(SYNC_CURSOR_KEY)).toBeUndefined();
    expect(await internalRepository.get(LAST_PUSHED_AT_KEY)).toBeUndefined();
    expect(await internalRepository.get(LAST_SYNCED_AT_KEY)).toBeUndefined();
  });
});
