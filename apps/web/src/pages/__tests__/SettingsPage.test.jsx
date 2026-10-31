import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import SettingsPage from "@/pages/SettingsPage.jsx";
import settingsRepository from "@/services/settingsRepository.js";
import { useHidePrice } from "@/hooks/useHidePrice.js";

vi.mock("@/services/settingsRepository.js", async (importOriginal) => ({
  ...(await importOriginal()),
  default: { set: vi.fn() },
}));
vi.mock("@/hooks/useHidePrice.js", () => ({
  useHidePrice: vi.fn(() => false),
}));
vi.mock("@/components/sync/SyncCard.jsx", () => ({ SyncCard: () => null }));
vi.mock("@/components/BackupCard.jsx", () => ({ BackupCard: () => null }));

function renderPage() {
  render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
}

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useHidePrice).mockReturnValue(false);
  });

  it("stores hidePrice when the switch is turned on", () => {
    renderPage();

    fireEvent.click(screen.getByLabelText("Esconder valor"));

    expect(settingsRepository.set).toHaveBeenCalledWith("hidePrice", true);
  });

  it("leaves the hourly price editable while the price is shown", () => {
    renderPage();

    expect(screen.getByLabelText("Valor por hora")).toBeEnabled();
  });

  it("disables the hourly price and stops mentioning it when hidePrice is set", () => {
    vi.mocked(useHidePrice).mockReturnValue(true);
    renderPage();

    expect(screen.getByLabelText("Valor por hora")).toBeDisabled();
    expect(screen.queryByText(/cálculo de valor/)).not.toBeInTheDocument();
  });

  it("saves the hourly price as it is typed", () => {
    renderPage();

    fireEvent.change(screen.getByLabelText("Valor por hora"), {
      target: { value: "25" },
    });

    expect(settingsRepository.set).toHaveBeenCalledWith("hourlyPrice", 25);
  });

  it("lets the hourly price be emptied to type a new one", () => {
    renderPage();
    const input = screen.getByLabelText("Valor por hora");

    fireEvent.change(input, { target: { value: "" } });

    expect(input).toHaveValue(null);
    expect(settingsRepository.set).not.toHaveBeenCalled();
  });

  it("shows the stored price again when an emptied field loses focus", () => {
    renderPage();
    const input = screen.getByLabelText("Valor por hora");

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);

    expect(input).toHaveValue(10);
  });
});
