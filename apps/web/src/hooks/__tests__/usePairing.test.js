import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { SYNC_TOKEN_KEY } from "@cronoz/shared";

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

vi.mock("@/services/syncManager.js", () => ({
  default: { sync: vi.fn(), unpair: vi.fn() },
}));

import db from "@/services/db.js";
import internalRepository from "@/services/internalRepository.js";
import syncService, { SyncError } from "@/services/syncService.js";
import syncManager from "@/services/syncManager.js";
import { usePairing } from "@/hooks/usePairing.js";

beforeEach(async () => {
  await db.internal.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("usePairing.generateCode", () => {
  it("transitions to 'showing-code' with code and expiresAt", async () => {
    syncService.pairInitiate.mockResolvedValue({
      code: "123456",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    const { result } = renderHook(() => usePairing());

    await act(async () => {
      await result.current.generateCode();
    });

    expect(result.current.mode).toBe("showing-code");
    expect(result.current.code).toBe("123456");
    expect(result.current.remainingMs).toBeGreaterThan(0);
  });

  it("sets error when initiate fails", async () => {
    syncService.pairInitiate.mockRejectedValue(
      new SyncError("network_error", { body: "x" }),
    );

    const { result } = renderHook(() => usePairing());
    await act(async () => {
      await result.current.generateCode();
    });

    expect(result.current.mode).toBe("idle");
    expect(result.current.error).toBe("network_error");
  });
});

describe("usePairing.confirmPaired", () => {
  it("plants token, returns to idle, triggers sync", async () => {
    syncService.refreshToken.mockResolvedValue({
      token: "tok",
      syncGroupId: "g",
    });

    const { result } = renderHook(() => usePairing());
    await act(async () => {
      await result.current.confirmPaired();
    });

    expect(await internalRepository.get(SYNC_TOKEN_KEY)).toBe("tok");
    expect(result.current.mode).toBe("idle");
    expect(syncManager.sync).toHaveBeenCalled();
  });
});

describe("usePairing.joinWithCode", () => {
  it("plants token and triggers sync on success", async () => {
    syncService.pairJoin.mockResolvedValue({
      token: "tok",
      syncGroupId: "g",
    });

    const { result } = renderHook(() => usePairing());
    await act(async () => {
      await result.current.joinWithCode("123456");
    });

    expect(await internalRepository.get(SYNC_TOKEN_KEY)).toBe("tok");
    expect(syncManager.sync).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it("maps 400 to 'invalid_or_expired_code'", async () => {
    syncService.pairJoin.mockRejectedValue(
      new SyncError("http_400", {
        status: 400,
        body: { error: "invalid_or_expired_code" },
      }),
    );

    const { result } = renderHook(() => usePairing());
    await act(async () => {
      await result.current.joinWithCode("000000");
    });

    expect(result.current.error).toBe("invalid_or_expired_code");
    expect(await internalRepository.get(SYNC_TOKEN_KEY)).toBeUndefined();
  });

  it("maps 409 to 'device_already_paired'", async () => {
    syncService.pairJoin.mockRejectedValue(
      new SyncError("http_409", {
        status: 409,
        body: { error: "device_already_paired" },
      }),
    );

    const { result } = renderHook(() => usePairing());
    await act(async () => {
      await result.current.joinWithCode("123456");
    });

    expect(result.current.error).toBe("device_already_paired");
  });
});

describe("usePairing countdown", () => {
  it("returns to idle when expiresAt is already past", async () => {
    syncService.pairInitiate.mockResolvedValue({
      code: "123456",
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });

    const { result } = renderHook(() => usePairing());
    await act(async () => {
      await result.current.generateCode();
    });

    await waitFor(() => expect(result.current.mode).toBe("idle"));
  });
});
