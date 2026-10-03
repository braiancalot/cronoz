import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { PENDING_PAIRING_KEY } from "@cronoz/shared";

vi.mock("@/services/syncService.js", async () => {
  const actual = await vi.importActual("@/services/syncService.js");
  return {
    ...actual,
    default: {
      pairInitiate: vi.fn(),
      pairJoin: vi.fn(),
      pairStatus: vi.fn(),
      refreshToken: vi.fn(),
    },
  };
});

vi.mock("@/services/syncManager.js", () => ({
  default: { adoptToken: vi.fn() },
}));

import db from "@/services/db.js";
import internalRepository from "@/services/internalRepository.js";
import syncService, { SyncError } from "@/services/syncService.js";
import syncManager from "@/services/syncManager.js";
import { SyncStatusProvider } from "@/providers/SyncStatusProvider.jsx";
import { usePairing } from "@/hooks/usePairing.js";

const CODE = "ABCD2345";
const onPaired = vi.fn();

function issueCode({ expiresInMs = 60_000 } = {}) {
  syncService.pairInitiate.mockResolvedValue({
    code: CODE,
    expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
  });
}

function answerStatus(status) {
  syncService.pairStatus.mockResolvedValue({ status });
}

async function renderHosting() {
  const view = renderHook(() => usePairing({ onPaired, pollMs: 10 }));
  await act(() => view.result.current.generateCode());
  return view;
}

beforeEach(async () => {
  await db.internal.clear();
  vi.clearAllMocks();
  answerStatus("waiting");
  syncService.refreshToken.mockResolvedValue({ token: "tok" });
});

describe("usePairing.generateCode", () => {
  it("shows the issued code and stores it as pending", async () => {
    issueCode();

    const { result } = await renderHosting();

    expect(result.current.flow).toMatchObject({
      screen: "hosting",
      hostState: "waiting",
      code: CODE,
    });
    const pending = await internalRepository.get(PENDING_PAIRING_KEY);
    expect(pending.code).toBe(CODE);
  });

  it("reports the error and stays idle when initiate fails", async () => {
    syncService.pairInitiate.mockRejectedValue(
      new SyncError("network_error", { body: "x" }),
    );

    const { result } = await renderHosting();

    expect(result.current.flow).toMatchObject({
      screen: "idle",
      busy: false,
      error: "network_error",
    });
  });

  it("reports the new-group quota when initiate answers 429", async () => {
    syncService.pairInitiate.mockRejectedValue(
      new SyncError("http_429", { status: 429 }),
    );

    const { result } = await renderHosting();

    expect(result.current.flow.error).toBe("too_many_new_groups");
  });
});

describe("usePairing host polling", () => {
  it("adopts the group token once the other device joins", async () => {
    issueCode();
    answerStatus("joined");

    const { result } = await renderHosting();

    await waitFor(() => expect(onPaired).toHaveBeenCalledOnce());
    expect(syncManager.adoptToken).toHaveBeenCalledWith("tok");
    expect(result.current.flow.screen).toBe("idle");
    expect(await internalRepository.get(PENDING_PAIRING_KEY)).toBeUndefined();
  });

  it("asks about the code this device generated", async () => {
    issueCode();

    await renderHosting();

    await waitFor(() => expect(syncService.pairStatus).toHaveBeenCalled());
    const [request] = syncService.pairStatus.mock.calls[0];
    expect(request.code).toBe(CODE);
    expect(request.deviceId).toEqual(expect.any(String));
  });

  it.each(["expired", "burned"])("stops on a %s code", async (status) => {
    issueCode();
    answerStatus(status);

    const { result } = await renderHosting();

    await waitFor(() => expect(result.current.flow.hostState).toBe(status));
    expect(syncManager.adoptToken).not.toHaveBeenCalled();
  });

  it("keeps asking while the code waits", async () => {
    issueCode();
    await renderHosting();
    await waitFor(() => expect(syncService.pairStatus).toHaveBeenCalled());
    expect(onPaired).not.toHaveBeenCalled();

    answerStatus("joined");

    await waitFor(() => expect(onPaired).toHaveBeenCalledOnce());
  });

  it("retries on the next poll when the token fetch fails", async () => {
    issueCode();
    answerStatus("joined");
    syncService.refreshToken.mockRejectedValueOnce(
      new SyncError("network_error", { body: "x" }),
    );

    await renderHosting();

    await waitFor(() => expect(onPaired).toHaveBeenCalledOnce());
    expect(syncService.refreshToken).toHaveBeenCalledTimes(2);
  });

  it("keeps waiting when the server is unreachable before the deadline", async () => {
    issueCode();
    syncService.pairStatus.mockRejectedValue(
      new SyncError("network_error", { body: "x" }),
    );

    const { result } = await renderHosting();

    await waitFor(() => expect(syncService.pairStatus).toHaveBeenCalled());
    expect(result.current.flow.hostState).toBe("waiting");
  });

  it("expires by the local clock when the server is unreachable", async () => {
    issueCode({ expiresInMs: -1000 });
    syncService.pairStatus.mockRejectedValue(
      new SyncError("network_error", { body: "x" }),
    );

    const { result } = await renderHosting();

    await waitFor(() => expect(result.current.flow.hostState).toBe("expired"));
  });

  it("resumes a pending code after the page was left", async () => {
    await internalRepository.set(PENDING_PAIRING_KEY, {
      code: CODE,
      expiresAt: Date.now() + 60_000,
    });
    answerStatus("joined");

    renderHook(() => usePairing({ onPaired }), { wrapper: SyncStatusProvider });

    await waitFor(() => expect(onPaired).toHaveBeenCalledOnce());
    expect(syncManager.adoptToken).toHaveBeenCalledWith("tok");
  });
});

describe("usePairing.cancel", () => {
  it("returns to idle and forgets the pending code", async () => {
    issueCode();
    const { result } = await renderHosting();

    await act(() => result.current.cancel());

    expect(result.current.flow.screen).toBe("idle");
    expect(await internalRepository.get(PENDING_PAIRING_KEY)).toBeUndefined();
  });
});

describe("usePairing.joinWithCode", () => {
  async function join(code) {
    const view = renderHook(() => usePairing({ onPaired }));
    act(() => view.result.current.openJoin());
    let joined;
    await act(async () => {
      joined = await view.result.current.joinWithCode(code);
    });
    return { ...view, joined };
  }

  it("adopts the token and announces the pairing", async () => {
    syncService.pairJoin.mockResolvedValue({ token: "tok", syncGroupId: "g" });

    const { result, joined } = await join(CODE);

    expect(joined).toBe(true);
    expect(syncManager.adoptToken).toHaveBeenCalledWith("tok");
    expect(onPaired).toHaveBeenCalledOnce();
    expect(result.current.flow.screen).toBe("idle");
  });

  it.each([
    [400, "invalid_or_expired_code"],
    [409, "device_already_paired"],
  ])("maps %i to %s and stays on the form", async (status, error) => {
    syncService.pairJoin.mockRejectedValue(
      new SyncError(`http_${status}`, { status }),
    );

    const { result, joined } = await join(CODE);

    expect(joined).toBe(false);
    expect(result.current.flow).toMatchObject({ screen: "joining", error });
    expect(syncManager.adoptToken).not.toHaveBeenCalled();
  });

  it("clears the error on request", async () => {
    syncService.pairJoin.mockRejectedValue(
      new SyncError("http_400", { status: 400 }),
    );
    const { result } = await join(CODE);

    act(() => result.current.clearError());

    expect(result.current.flow.error).toBeNull();
  });
});
