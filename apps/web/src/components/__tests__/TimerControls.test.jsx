import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TimerControls } from "@/components/TimerControls.jsx";

const defaultProps = {
  isRunning: false,
  hasTime: false,
  onStart: vi.fn(),
  onPause: vi.fn(),
  onReset: vi.fn(),
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
    renderControls({ isRunning: true, hasTime: true });

    expect(screen.getByText("Pause")).toBeInTheDocument();
    expect(screen.queryByText("Start")).not.toBeInTheDocument();
  });

  it("shows Reset button when stopped with time", () => {
    renderControls({ hasTime: true });

    expect(screen.getByText("Reset")).toBeInTheDocument();
  });

  it("does not show Reset when stopped without time", () => {
    renderControls();

    expect(screen.queryByText("Reset")).not.toBeInTheDocument();
  });

  it("shows Lap button when running with time", () => {
    renderControls({ isRunning: true, hasTime: true });

    expect(screen.getByText("Lap")).toBeInTheDocument();
  });

  it("does not show Lap when stopped", () => {
    renderControls({ hasTime: true });

    expect(screen.queryByText("Lap")).not.toBeInTheDocument();
  });

  it("calls onStart when Start is clicked", async () => {
    const onStart = vi.fn();
    renderControls({ onStart });

    await userEvent.click(screen.getByText("Start"));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("calls onPause when Pause is clicked", async () => {
    const onPause = vi.fn();
    renderControls({ isRunning: true, hasTime: true, onPause });

    await userEvent.click(screen.getByText("Pause"));
    expect(onPause).toHaveBeenCalledOnce();
  });

  it("calls onReset when Reset is clicked", async () => {
    const onReset = vi.fn();
    renderControls({ hasTime: true, onReset });

    await userEvent.click(screen.getByText("Reset"));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("calls onAddLap when Lap is clicked", async () => {
    const onAddLap = vi.fn();
    renderControls({ isRunning: true, hasTime: true, onAddLap });

    await userEvent.click(screen.getByText("Lap"));
    expect(onAddLap).toHaveBeenCalledOnce();
  });
});
