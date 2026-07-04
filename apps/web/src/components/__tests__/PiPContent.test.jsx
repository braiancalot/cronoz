import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PiPContent } from "@/components/PiPContent.jsx";

function setup(overrides = {}) {
  const props = {
    name: "Projeto X",
    time: 1000,
    totalTime: null,
    isRunning: true,
    hourlyPrice: 10,
    hasLapTime: true,
    lapCount: 0,
    onStart: vi.fn(),
    onPause: vi.fn(),
    onAddLap: vi.fn(),
    onDiscardCurrentTime: vi.fn(),
    canDiscardCurrentTime: true,
    onCommitAdjust: vi.fn(),
    ...overrides,
  };
  render(<PiPContent {...props} />);
  return props;
}

describe("PiPContent", () => {
  it("starts on the idle screen", () => {
    setup();
    expect(screen.getByText("Projeto X")).toBeTruthy();
  });

  it("opens the discard screen and confirms", async () => {
    const user = userEvent.setup();
    const props = setup();
    await user.click(screen.getByTitle("Mais opções"));
    await user.click(
      await screen.findByRole("menuitem", { name: "Descartar tempo atual" }),
    );
    await user.click(screen.getByRole("button", { name: "Sim" }));
    expect(props.onDiscardCurrentTime).toHaveBeenCalledOnce();
    expect(screen.getByText("Projeto X")).toBeTruthy();
  });

  it("cancels the discard screen without discarding", async () => {
    const user = userEvent.setup();
    const props = setup();
    await user.click(screen.getByTitle("Mais opções"));
    await user.click(
      await screen.findByRole("menuitem", { name: "Descartar tempo atual" }),
    );
    await user.click(screen.getByRole("button", { name: "Não" }));
    expect(props.onDiscardCurrentTime).not.toHaveBeenCalled();
    expect(screen.getByText("Projeto X")).toBeTruthy();
  });

  it("pauses and prefills the lap name when adding a lap", async () => {
    const user = userEvent.setup();
    const props = setup({ lapCount: 2 });
    await user.click(screen.getByRole("button", { name: "Volta" }));
    expect(props.onPause).toHaveBeenCalledOnce();
    expect(screen.getByRole("textbox").value).toBe("3º ");
  });

  it("saves the lap and returns to idle", async () => {
    const user = userEvent.setup();
    const props = setup({ lapCount: 0 });
    await user.click(screen.getByRole("button", { name: "Volta" }));
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(props.onAddLap).toHaveBeenCalledWith("1º ");
    expect(screen.getByText("Projeto X")).toBeTruthy();
  });

  it("cancels lap naming without saving", async () => {
    const user = userEvent.setup();
    const props = setup();
    await user.click(screen.getByRole("button", { name: "Volta" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(props.onAddLap).not.toHaveBeenCalled();
    expect(screen.getByText("Projeto X")).toBeTruthy();
  });

  it("opens the adjust screen, pauses, and commits the nudged time on Pronto", async () => {
    const user = userEvent.setup();
    const props = setup({ time: 1000 });
    await user.click(screen.getByTitle("Mais opções"));
    await user.click(
      await screen.findByRole("menuitem", { name: "Ajustar tempo" }),
    );
    expect(props.onPause).toHaveBeenCalledOnce();

    // Nudges stay local until confirmed.
    await user.click(screen.getByRole("button", { name: "Aumentar 10s" }));
    expect(props.onCommitAdjust).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Pronto" }));
    expect(props.onCommitAdjust).toHaveBeenCalledWith(11000); // 1000 + 10s
    expect(screen.getByText("Projeto X")).toBeTruthy();
  });

  it("discards the nudge when Cancelar is clicked", async () => {
    const user = userEvent.setup();
    const props = setup({ time: 1000 });
    await user.click(screen.getByTitle("Mais opções"));
    await user.click(
      await screen.findByRole("menuitem", { name: "Ajustar tempo" }),
    );
    await user.click(screen.getByRole("button", { name: "Aumentar 10s" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(props.onCommitAdjust).not.toHaveBeenCalled();
    expect(screen.getByText("Projeto X")).toBeTruthy();
  });
});
