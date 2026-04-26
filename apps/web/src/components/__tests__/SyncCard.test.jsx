import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("@/hooks/usePairing.js", () => ({
  usePairing: vi.fn(),
}));
vi.mock("@/hooks/useSyncStatus.js", () => ({
  useSyncStatus: vi.fn(),
}));
vi.mock("@/services/syncManager.js", () => ({
  default: {
    sync: vi.fn(),
    unpair: vi.fn(),
    getDeviceCount: vi.fn(),
  },
}));
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

import { usePairing } from "@/hooks/usePairing.js";
import { useSyncStatus } from "@/hooks/useSyncStatus.js";
import syncManager from "@/services/syncManager.js";
import { SyncCard } from "@/components/SyncCard.jsx";

const baseStatus = {
  isPaired: false,
  lastSyncedAt: null,
  syncing: false,
  error: null,
  isOnline: true,
  unpair: vi.fn(),
  syncNow: vi.fn(),
};

const basePairing = {
  mode: "idle",
  code: null,
  remainingMs: 0,
  loading: false,
  error: null,
  generateCode: vi.fn(),
  confirmPaired: vi.fn(),
  joinWithCode: vi.fn(),
  cancel: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  syncManager.getDeviceCount.mockResolvedValue(null);
});

describe("SyncCard", () => {
  it("renders not-paired state with generate/insert buttons", () => {
    usePairing.mockReturnValue(basePairing);
    useSyncStatus.mockReturnValue(baseStatus);

    render(<SyncCard />);

    expect(screen.getByRole("button", { name: /gerar código/i })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /inserir código/i }),
    ).toBeTruthy();
  });

  it("renders showing-code state with the code and confirm button", () => {
    usePairing.mockReturnValue({
      ...basePairing,
      mode: "showing-code",
      code: "123456",
      remainingMs: 60_000,
    });
    useSyncStatus.mockReturnValue(baseStatus);

    render(<SyncCard />);

    expect(screen.getByText("123456")).toBeTruthy();
    expect(screen.getByText(/Expira em 1:00/)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Já pareei o outro device/i }),
    ).toBeTruthy();
  });

  it("renders paired state with last sync, device count, sync/unpair buttons", async () => {
    syncManager.getDeviceCount.mockResolvedValue(2);
    usePairing.mockReturnValue(basePairing);
    useSyncStatus.mockReturnValue({
      ...baseStatus,
      isPaired: true,
      lastSyncedAt: Date.now() - 5_000,
    });

    render(<SyncCard />);

    await waitFor(() =>
      expect(screen.getByText(/2 dispositivos no grupo/)).toBeTruthy(),
    );
    expect(screen.getByText(/Última sincronização/)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Sincronizar agora/i }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: /Desparear/i })).toBeTruthy();
    expect(syncManager.getDeviceCount).toHaveBeenCalledOnce();
  });
});
