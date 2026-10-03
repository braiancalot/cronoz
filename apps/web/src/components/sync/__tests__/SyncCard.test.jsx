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
  default: { getDeviceCount: vi.fn() },
}));
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

import { toast } from "sonner";
import { usePairing } from "@/hooks/usePairing.js";
import { useSyncStatus } from "@/hooks/useSyncStatus.js";
import syncManager from "@/services/syncManager.js";
import { INITIAL_PAIRING_FLOW, initPairingFlow } from "@/lib/pairingFlow.js";
import { SyncCard } from "@/components/sync/SyncCard.jsx";

const baseStatus = {
  isPaired: false,
  lastSyncedAt: null,
  wasRevoked: false,
  syncing: false,
  error: null,
  isOnline: true,
  unpair: vi.fn(),
  syncNow: vi.fn(),
};

const pairedStatus = {
  ...baseStatus,
  isPaired: true,
  lastSyncedAt: Date.now() - 5_000,
};

const basePairing = {
  flow: INITIAL_PAIRING_FLOW,
  generateCode: vi.fn(),
  joinWithCode: vi.fn(),
  cancel: vi.fn(),
  openJoin: vi.fn(),
  clearError: vi.fn(),
};

const joiningFlow = { ...INITIAL_PAIRING_FLOW, screen: "joining" };

function hostingFlow(overrides) {
  const issued = { code: "ABCD2345", expiresAt: Date.now() + 60_500 };
  return { ...initPairingFlow(issued), ...overrides };
}

function renderCard({ pairing, status } = {}) {
  usePairing.mockReturnValue({ ...basePairing, ...pairing });
  useSyncStatus.mockReturnValue({ ...baseStatus, ...status });
  return render(<SyncCard />);
}

beforeEach(() => {
  vi.clearAllMocks();
  syncManager.getDeviceCount.mockResolvedValue(2);
});

describe("SyncCard: not paired", () => {
  it("offers to generate a code or type one", async () => {
    const generateCode = vi.fn();
    const openJoin = vi.fn();
    renderCard({ pairing: { generateCode, openJoin } });

    await userEvent.click(screen.getByRole("button", { name: "Gerar código" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Tenho um código" }),
    );

    expect(generateCode).toHaveBeenCalledOnce();
    expect(openJoin).toHaveBeenCalledOnce();
  });

  it("shows a generate failure in the card instead of a toast", () => {
    const flow = { ...INITIAL_PAIRING_FLOW, error: "too_many_new_groups" };
    renderCard({ pairing: { flow } });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Limite de pareamentos atingido. Tente em 1 hora.",
    );
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("disables pairing while offline and says why", () => {
    renderCard({ status: { isOnline: false } });

    expect(screen.getByRole("button", { name: "Gerar código" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Tenho um código" }),
    ).toBeDisabled();
    expect(
      screen.getByText("Sem conexão. O pareamento precisa de internet."),
    ).toBeInTheDocument();
  });

  it("tells a device that it was unpaired from elsewhere", () => {
    renderCard({ status: { wasRevoked: true } });

    expect(
      screen.getByText(/Este dispositivo foi despareado/),
    ).toBeInTheDocument();
  });
});

describe("SyncCard: showing a code", () => {
  it("shows the code and the countdown, with no confirm button", () => {
    renderCard({ pairing: { flow: hostingFlow() } });

    expect(screen.getByText("ABCD-2345")).toBeInTheDocument();
    expect(screen.getByText(/expira em 1:00/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Já pareei/i })).toBeNull();
  });

  it("copies the code without the reading hyphen", async () => {
    const user = userEvent.setup();
    renderCard({ pairing: { flow: hostingFlow() } });

    await user.click(screen.getByRole("button", { name: /ABCD-2345/ }));

    expect(await navigator.clipboard.readText()).toBe("ABCD2345");
    expect(toast).toHaveBeenCalledWith("Código copiado");
  });

  it("keeps the code screen on a device that is already paired", () => {
    renderCard({ pairing: { flow: hostingFlow() }, status: pairedStatus });

    expect(screen.getByText("ABCD-2345")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Sincronizar agora/ }),
    ).toBeNull();
  });

  it.each([
    ["expired", "O código expirou."],
    ["burned", "Código invalidado. Gere outro."],
  ])("offers another code once it is %s", async (hostState, message) => {
    const generateCode = vi.fn();
    const flow = hostingFlow({ hostState });
    renderCard({ pairing: { flow, generateCode } });

    await userEvent.click(
      screen.getByRole("button", { name: "Gerar outro código" }),
    );

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.queryByText("ABCD-2345")).toBeNull();
    expect(generateCode).toHaveBeenCalledOnce();
  });
});

describe("SyncCard: typing a code", () => {
  it("focuses the field and joins on Enter with the pasted code", async () => {
    const user = userEvent.setup();
    const joinWithCode = vi.fn().mockResolvedValue(true);
    renderCard({ pairing: { flow: joiningFlow, joinWithCode } });

    expect(
      screen.getByLabelText("Código mostrado no outro dispositivo"),
    ).toHaveFocus();
    await user.paste(" ABCD-2345 ");
    await user.keyboard("{Enter}");

    expect(joinWithCode).toHaveBeenCalledWith("ABCD2345");
  });

  it("does not submit an incomplete code", async () => {
    const user = userEvent.setup();
    const joinWithCode = vi.fn();
    renderCard({ pairing: { flow: joiningFlow, joinWithCode } });

    await user.keyboard("ABCD{Enter}");

    expect(screen.getByRole("button", { name: "Parear" })).toBeDisabled();
    expect(joinWithCode).not.toHaveBeenCalled();
  });

  it("keeps the typed code after a failed join", async () => {
    const user = userEvent.setup();
    const joinWithCode = vi.fn().mockResolvedValue(false);
    renderCard({ pairing: { flow: joiningFlow, joinWithCode } });

    await user.keyboard("ABCD2345{Enter}");

    expect(screen.getByRole("textbox")).toHaveValue("ABCD2345");
  });

  it("shows the join error under the field and clears it on typing", async () => {
    const user = userEvent.setup();
    const clearError = vi.fn();
    const flow = { ...joiningFlow, error: "invalid_or_expired_code" };
    renderCard({ pairing: { flow, clearError } });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Código inválido ou expirado. Confira no outro dispositivo ou gere um novo.",
    );
    expect(toast.error).not.toHaveBeenCalled();
    await user.keyboard("A");

    expect(clearError).toHaveBeenCalled();
  });

  it("locks the submit button while pairing", () => {
    renderCard({ pairing: { flow: { ...joiningFlow, busy: true } } });

    expect(screen.getByRole("button", { name: "Pareando…" })).toBeDisabled();
  });

  it("goes back through Voltar", async () => {
    const cancel = vi.fn();
    renderCard({ pairing: { flow: joiningFlow, cancel } });

    await userEvent.click(screen.getByRole("button", { name: "Voltar" }));

    expect(cancel).toHaveBeenCalledOnce();
  });
});

describe("SyncCard: paired", () => {
  it("shows the status line, the device count and the actions", async () => {
    renderCard({ status: pairedStatus });

    expect(await screen.findByText("2 dispositivos pareados")).toBeTruthy();
    expect(screen.getByRole("status")).toHaveTextContent(/^Sincronizado · /);
    expect(
      screen.getByRole("button", { name: /Sincronizar agora/ }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Desparear este dispositivo" }),
    ).toBeInTheDocument();
  });

  it("recounts the devices after every sync", async () => {
    const view = renderCard({ status: pairedStatus });
    await screen.findByText("2 dispositivos pareados");

    syncManager.getDeviceCount.mockResolvedValue(3);
    useSyncStatus.mockReturnValue({
      ...pairedStatus,
      lastSyncedAt: Date.now(),
    });
    view.rerender(<SyncCard />);

    expect(await screen.findByText("3 dispositivos pareados")).toBeTruthy();
  });

  it("keeps the last count when the recount fails", async () => {
    const view = renderCard({ status: pairedStatus });
    await screen.findByText("2 dispositivos pareados");

    syncManager.getDeviceCount.mockResolvedValue(null);
    useSyncStatus.mockReturnValue({
      ...pairedStatus,
      lastSyncedAt: Date.now(),
    });
    view.rerender(<SyncCard />);

    await waitFor(() =>
      expect(syncManager.getDeviceCount).toHaveBeenCalledTimes(2),
    );
    expect(screen.getByText("2 dispositivos pareados")).toBeInTheDocument();
  });

  it("shows a failed sync in the status line instead of a toast", async () => {
    const syncNow = vi.fn();
    renderCard({ status: { ...pairedStatus, error: "http_500", syncNow } });

    await userEvent.click(
      screen.getByRole("button", { name: /Sincronizar agora/ }),
    );

    expect(syncNow).toHaveBeenCalledOnce();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Falha ao sincronizar: servidor indisponível.",
    );
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("blocks server actions while offline", () => {
    renderCard({ status: { ...pairedStatus, isOnline: false } });

    expect(
      screen.getByRole("button", { name: /Sincronizar agora/ }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Adicionar dispositivo/ }),
    ).toBeDisabled();
  });

  it("generates a code to add a device", async () => {
    const generateCode = vi.fn();
    renderCard({ pairing: { generateCode }, status: pairedStatus });

    await userEvent.click(
      screen.getByRole("button", { name: /Adicionar dispositivo/ }),
    );

    expect(generateCode).toHaveBeenCalledOnce();
  });

  it("unpairs only after confirming", async () => {
    const unpair = vi.fn();
    renderCard({ status: { ...pairedStatus, unpair } });

    await userEvent.click(
      screen.getByRole("button", { name: "Desparear este dispositivo" }),
    );
    expect(unpair).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Desparear" }));

    expect(unpair).toHaveBeenCalledOnce();
  });
});
