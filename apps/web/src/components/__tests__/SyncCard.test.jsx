import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
    getStatus: vi.fn(),
  },
}));
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

import { toast } from "sonner";
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
  syncManager.getStatus.mockReturnValue({ syncing: false, error: null });
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

  it("renders 'Adicionar dispositivo' button when paired", async () => {
    syncManager.getDeviceCount.mockResolvedValue(2);
    const generateCode = vi.fn();
    usePairing.mockReturnValue({ ...basePairing, generateCode });
    useSyncStatus.mockReturnValue({ ...baseStatus, isPaired: true });

    render(<SyncCard />);

    const button = await screen.findByRole("button", {
      name: /Adicionar dispositivo/i,
    });
    expect(button).toBeTruthy();

    await userEvent.click(button);
    expect(generateCode).toHaveBeenCalledOnce();
  });

  it("shows error line when sync has failed", async () => {
    syncManager.getDeviceCount.mockResolvedValue(2);
    usePairing.mockReturnValue(basePairing);
    useSyncStatus.mockReturnValue({
      ...baseStatus,
      isPaired: true,
      lastSyncedAt: Date.now() - 5_000,
      error: "network_error",
    });

    render(<SyncCard />);

    await waitFor(() =>
      expect(screen.getByText(/Falha na última sincronização/i)).toBeTruthy(),
    );
    expect(screen.getByText(/Sem conexão com o servidor/i)).toBeTruthy();
  });

  it("shows error toast when manual sync fails", async () => {
    syncManager.getDeviceCount.mockResolvedValue(2);
    const syncNow = vi.fn().mockResolvedValue(undefined);
    syncManager.getStatus.mockReturnValue({
      syncing: false,
      error: "http_500",
    });
    usePairing.mockReturnValue(basePairing);
    useSyncStatus.mockReturnValue({
      ...baseStatus,
      isPaired: true,
      syncNow,
    });

    render(<SyncCard />);

    const button = await screen.findByRole("button", {
      name: /Sincronizar agora/i,
    });
    await userEvent.click(button);

    expect(syncNow).toHaveBeenCalledOnce();
    expect(toast.error).toHaveBeenCalledWith(
      "Servidor indisponível. Tente novamente.",
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("shows error toast when joinWithCode returns 409 (device_already_paired)", async () => {
    const joinWithCode = vi.fn().mockResolvedValue({
      ok: false,
      error: "device_already_paired",
    });
    usePairing.mockReturnValue({ ...basePairing, joinWithCode });
    useSyncStatus.mockReturnValue(baseStatus);

    render(<SyncCard />);

    await userEvent.click(
      screen.getByRole("button", { name: /Inserir código/i }),
    );
    const input = screen.getByLabelText(/Código de 6 dígitos/i);
    await userEvent.type(input, "123456");
    await userEvent.click(screen.getByRole("button", { name: /^Parear$/ }));

    expect(joinWithCode).toHaveBeenCalledWith("123456");
    expect(toast.error).toHaveBeenCalledWith(
      "Este dispositivo já está pareado em outro grupo.",
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("shows success toast when manual sync succeeds", async () => {
    syncManager.getDeviceCount.mockResolvedValue(2);
    const syncNow = vi.fn().mockResolvedValue(undefined);
    syncManager.getStatus.mockReturnValue({ syncing: false, error: null });
    usePairing.mockReturnValue(basePairing);
    useSyncStatus.mockReturnValue({
      ...baseStatus,
      isPaired: true,
      syncNow,
    });

    render(<SyncCard />);

    const button = await screen.findByRole("button", {
      name: /Sincronizar agora/i,
    });
    await userEvent.click(button);

    expect(toast.success).toHaveBeenCalledWith("Sincronizado");
    expect(toast.error).not.toHaveBeenCalled();
  });
});
