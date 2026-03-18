import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InstallBanner } from "@/components/InstallBanner.jsx";

const mockUseInstallPrompt = vi.fn();

vi.mock("@/hooks/useInstallPrompt", () => ({
  useInstallPrompt: (...args) => mockUseInstallPrompt(...args),
}));

describe("InstallBanner", () => {
  it("renders nothing when not installable", () => {
    mockUseInstallPrompt.mockReturnValue({
      isInstallable: false,
      promptInstall: vi.fn(),
      dismiss: vi.fn(),
    });

    const { container } = render(<InstallBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders install and dismiss buttons when installable", () => {
    mockUseInstallPrompt.mockReturnValue({
      isInstallable: true,
      promptInstall: vi.fn(),
      dismiss: vi.fn(),
    });

    render(<InstallBanner />);

    expect(screen.getByText("Instalar")).toBeInTheDocument();
    expect(screen.getByLabelText("Fechar")).toBeInTheDocument();
  });

  it("calls promptInstall when install button is clicked", async () => {
    const promptInstall = vi.fn();
    mockUseInstallPrompt.mockReturnValue({
      isInstallable: true,
      promptInstall,
      dismiss: vi.fn(),
    });

    render(<InstallBanner />);
    await userEvent.click(screen.getByText("Instalar"));

    expect(promptInstall).toHaveBeenCalledOnce();
  });

  it("calls dismiss when close button is clicked", async () => {
    const dismiss = vi.fn();
    mockUseInstallPrompt.mockReturnValue({
      isInstallable: true,
      promptInstall: vi.fn(),
      dismiss,
    });

    render(<InstallBanner />);
    await userEvent.click(screen.getByLabelText("Fechar"));

    expect(dismiss).toHaveBeenCalledOnce();
  });
});
