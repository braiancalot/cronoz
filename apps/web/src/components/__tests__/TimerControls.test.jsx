import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TimerControls } from "@/components/TimerControls.jsx";

const noop = () => {};

describe("TimerControls", () => {
  it("shows Iniciar when stopped and Pausar when running", () => {
    const { rerender } = render(
      <TimerControls
        isRunning={false}
        hasLapTime={false}
        onStart={noop}
        onPause={noop}
        onAddLap={noop}
      />,
    );
    expect(screen.getByRole("button", { name: "Iniciar" })).toBeInTheDocument();

    rerender(
      <TimerControls
        isRunning={true}
        hasLapTime={false}
        onStart={noop}
        onPause={noop}
        onAddLap={noop}
      />,
    );
    expect(screen.getByRole("button", { name: "Pausar" })).toBeInTheDocument();
  });

  it("calls onStart when stopped and onPause when running", async () => {
    const onStart = vi.fn();
    const onPause = vi.fn();
    const user = userEvent.setup();

    const { rerender } = render(
      <TimerControls
        isRunning={false}
        hasLapTime={false}
        onStart={onStart}
        onPause={onPause}
        onAddLap={noop}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Iniciar" }));
    expect(onStart).toHaveBeenCalledOnce();

    rerender(
      <TimerControls
        isRunning={true}
        hasLapTime={false}
        onStart={onStart}
        onPause={onPause}
        onAddLap={noop}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Pausar" }));
    expect(onPause).toHaveBeenCalledOnce();
  });

  it("disables Volta without lap time and triggers onAddLap with it", async () => {
    const onAddLap = vi.fn();
    const user = userEvent.setup();

    const { rerender } = render(
      <TimerControls
        isRunning
        hasLapTime={false}
        onStart={noop}
        onPause={noop}
        onAddLap={onAddLap}
      />,
    );
    expect(screen.getByRole("button", { name: "Volta" })).toBeDisabled();

    rerender(
      <TimerControls
        isRunning
        hasLapTime
        onStart={noop}
        onPause={noop}
        onAddLap={onAddLap}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Volta" }));
    expect(onAddLap).toHaveBeenCalledOnce();
  });

  it("hides Volta when showLap is false", () => {
    render(
      <TimerControls
        isRunning={false}
        hasLapTime={false}
        showLap={false}
        onStart={noop}
        onPause={noop}
        onAddLap={noop}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Volta" }),
    ).not.toBeInTheDocument();
  });

  it("applies vertical orientation", () => {
    const { container } = render(
      <TimerControls
        isRunning={false}
        hasLapTime={false}
        orientation="vertical"
        onStart={noop}
        onPause={noop}
        onAddLap={noop}
      />,
    );
    expect(container.firstChild).toHaveClass("flex-col");
  });
});
