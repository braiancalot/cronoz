import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PiPIdleView } from "@/components/PiPIdleView.jsx";

const baseProps = {
  name: "Projeto X",
  time: 1000,
  totalTime: null,
  isRunning: false,
  hourlyPrice: 10,
  hasLapTime: true,
  onStart: vi.fn(),
  onPause: vi.fn(),
  onAddLap: vi.fn(),
  onDiscard: vi.fn(),
  canDiscardCurrentTime: true,
};

describe("PiPIdleView", () => {
  it("shows the project name", () => {
    render(<PiPIdleView {...baseProps} />);
    expect(screen.getByText("Projeto X")).toBeTruthy();
  });

  it("calls onDiscard from the options menu", async () => {
    const onDiscard = vi.fn();
    const user = userEvent.setup();
    render(<PiPIdleView {...baseProps} onDiscard={onDiscard} />);
    await user.click(screen.getByTitle("Mais opções"));
    await user.click(
      await screen.findByRole("menuitem", { name: "Descartar tempo atual" }),
    );
    expect(onDiscard).toHaveBeenCalledOnce();
  });

  it("disables the discard menu item when canDiscardCurrentTime is false", async () => {
    const user = userEvent.setup();
    render(<PiPIdleView {...baseProps} canDiscardCurrentTime={false} />);
    await user.click(screen.getByTitle("Mais opções"));
    const item = await screen.findByRole("menuitem", {
      name: "Descartar tempo atual",
    });
    expect(item).toHaveAttribute("aria-disabled", "true");
  });

  it("calls onAddLap when lap button is clicked", async () => {
    const onAddLap = vi.fn();
    const user = userEvent.setup();
    render(<PiPIdleView {...baseProps} onAddLap={onAddLap} />);
    await user.click(screen.getByRole("button", { name: "Volta" }));
    expect(onAddLap).toHaveBeenCalledOnce();
  });

  it("starts the timer when not running", async () => {
    const onStart = vi.fn();
    const user = userEvent.setup();
    render(<PiPIdleView {...baseProps} isRunning={false} onStart={onStart} />);
    await user.click(screen.getByRole("button", { name: "Iniciar" }));
    expect(onStart).toHaveBeenCalledOnce();
  });
});
