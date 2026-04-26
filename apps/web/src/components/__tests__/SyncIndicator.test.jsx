import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

vi.mock("@/hooks/useSyncStatus.js", () => ({
  useSyncStatus: vi.fn(),
}));

import { useSyncStatus } from "@/hooks/useSyncStatus.js";
import { SyncIndicator } from "@/components/SyncIndicator.jsx";

const base = {
  isPaired: false,
  syncing: false,
  error: null,
  isOnline: true,
};

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

beforeEach(() => vi.clearAllMocks());

describe("SyncIndicator", () => {
  it("renders nothing when not paired", () => {
    useSyncStatus.mockReturnValue(base);
    const { container } = renderWithRouter(<SyncIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it("renders 'Sincronizado' label when paired and idle", () => {
    useSyncStatus.mockReturnValue({ ...base, isPaired: true });
    renderWithRouter(<SyncIndicator />);
    expect(screen.getByLabelText("Sincronizado")).toBeTruthy();
  });

  it("renders 'Sincronizando' when syncing", () => {
    useSyncStatus.mockReturnValue({ ...base, isPaired: true, syncing: true });
    renderWithRouter(<SyncIndicator />);
    expect(screen.getByLabelText("Sincronizando")).toBeTruthy();
  });

  it("renders 'Offline' when navigator is offline", () => {
    useSyncStatus.mockReturnValue({ ...base, isPaired: true, isOnline: false });
    renderWithRouter(<SyncIndicator />);
    expect(screen.getByLabelText("Offline")).toBeTruthy();
  });

  it("renders 'Erro de sincronização' when error is set", () => {
    useSyncStatus.mockReturnValue({
      ...base,
      isPaired: true,
      error: "network_error",
    });
    renderWithRouter(<SyncIndicator />);
    expect(screen.getByLabelText("Erro de sincronização")).toBeTruthy();
  });
});
