import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReloadPrompt } from "@/components/ReloadPrompt.jsx";

const mockUseServiceWorkerUpdate = vi.fn();

vi.mock("@/hooks/useServiceWorkerUpdate.js", () => ({
  useServiceWorkerUpdate: () => mockUseServiceWorkerUpdate(),
}));

function configure(needRefresh, updateServiceWorker = vi.fn()) {
  mockUseServiceWorkerUpdate.mockReturnValue({
    needRefresh,
    updateServiceWorker,
  });
  return updateServiceWorker;
}

describe("ReloadPrompt", () => {
  beforeEach(() => {
    mockUseServiceWorkerUpdate.mockReset();
  });

  it("renders nothing while no update is waiting", () => {
    configure(false);

    const { container } = render(<ReloadPrompt />);

    expect(container.firstChild).toBeNull();
  });

  it("shows the banner once an update is waiting", () => {
    configure(true);

    render(<ReloadPrompt />);

    expect(screen.getByText("Nova versão disponível")).toBeInTheDocument();
  });

  it("reloads through the service worker when updating", async () => {
    const updateServiceWorker = configure(true);

    render(<ReloadPrompt />);
    await userEvent.click(screen.getByText("Atualizar"));

    expect(updateServiceWorker).toHaveBeenCalledWith(true);
  });

  it("hides the banner after it is dismissed", async () => {
    configure(true);

    render(<ReloadPrompt />);
    await userEvent.click(screen.getByLabelText("Dispensar"));

    expect(
      screen.queryByText("Nova versão disponível"),
    ).not.toBeInTheDocument();
  });
});
