import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TimerControls } from "@/components/TimerControls.jsx";

const defaultProps = {
  isRunning: false,
  hasLapTime: false,
  onStart: vi.fn(),
  onPause: vi.fn(),
  onAddLap: vi.fn(),
};

function renderControls(overrides = {}) {
  return render(<TimerControls {...defaultProps} {...overrides} />);
}

describe("TimerControls", () => {
  it("shows Start button when stopped", () => {
    renderControls();

    expect(screen.getByText("Start")).toBeInTheDocument();
    expect(screen.queryByText("Pause")).not.toBeInTheDocument();
  });

  it("shows Pause button when running", () => {
    renderControls({ isRunning: true });

    expect(screen.getByText("Pause")).toBeInTheDocument();
    expect(screen.queryByText("Start")).not.toBeInTheDocument();
  });

  it("shows Lap button always", () => {
    renderControls();

    expect(screen.getByText("Etapa")).toBeInTheDocument();
  });

  it("disables Lap button when hasLapTime is false", () => {
    renderControls({ hasLapTime: false });

    expect(screen.getByText("Etapa")).toBeDisabled();
  });

  it("enables Lap button when hasLapTime is true", () => {
    renderControls({ hasLapTime: true });

    expect(screen.getByText("Etapa")).toBeEnabled();
  });

  it("does not call onAddLap when Lap is disabled", async () => {
    const onAddLap = vi.fn();
    renderControls({ hasLapTime: false, onAddLap });

    await userEvent.click(screen.getByText("Etapa"));
    expect(onAddLap).not.toHaveBeenCalled();
  });

  it("calls onStart when Start is clicked", async () => {
    const onStart = vi.fn();
    renderControls({ onStart });

    await userEvent.click(screen.getByText("Start"));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("calls onPause when Pause is clicked", async () => {
    const onPause = vi.fn();
    renderControls({ isRunning: true, onPause });

    await userEvent.click(screen.getByText("Pause"));
    expect(onPause).toHaveBeenCalledOnce();
  });

  it("calls onAddLap when Lap is clicked and enabled", async () => {
    const onAddLap = vi.fn();
    renderControls({ hasLapTime: true, onAddLap });

    await userEvent.click(screen.getByText("Etapa"));
    expect(onAddLap).toHaveBeenCalledOnce();
  });
});
