import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TimerAdjuster, AdjustActions } from "@/components/TimerAdjuster.jsx";

vi.mock("sonner", () => ({ toast: vi.fn() }));

describe("TimerAdjuster", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders a decrease and increase stepper for each step", () => {
    render(<TimerAdjuster time={60000} onStep={vi.fn()} />);

    for (const label of ["1m", "10s", "1s"]) {
      expect(
        screen.getByRole("button", { name: `Diminuir ${label}` }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: `Aumentar ${label}` }),
      ).toBeInTheDocument();
    }
  });

  it("calls onStep with a positive delta when increasing", async () => {
    const onStep = vi.fn();
    const user = userEvent.setup();
    render(<TimerAdjuster time={60000} onStep={onStep} />);

    await user.click(screen.getByRole("button", { name: "Aumentar 1m" }));
    expect(onStep).toHaveBeenCalledWith(60000);
  });

  it("calls onStep with a negative delta when decreasing", async () => {
    const onStep = vi.fn();
    const user = userEvent.setup();
    render(<TimerAdjuster time={60000} onStep={onStep} />);

    await user.click(screen.getByRole("button", { name: "Diminuir 10s" }));
    expect(onStep).toHaveBeenCalledWith(-10000);
  });

  it("renders all steppers plus both round buttons in the single-row layout", () => {
    render(
      <TimerAdjuster
        time={60000}
        layout="row"
        onStep={vi.fn()}
        onSnap={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("button")).toHaveLength(8);
  });

  it("drops the 1m steppers when omitMinuteStep is set", () => {
    render(
      <TimerAdjuster
        time={60000}
        omitMinuteStep
        onStep={vi.fn()}
        onSnap={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Diminuir 1m" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Aumentar 1m" }),
    ).not.toBeInTheDocument();
    // 2 round + (10s, 1s) on each side.
    expect(screen.getAllByRole("button")).toHaveLength(6);
  });

  it("renders round-down and round-up buttons", () => {
    render(<TimerAdjuster time={60000} onStep={vi.fn()} onSnap={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: "Arredondar para baixo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Arredondar para cima" }),
    ).toBeInTheDocument();
  });

  it("calls onSnap with 'down' when rounding down", async () => {
    const onSnap = vi.fn();
    const user = userEvent.setup();
    render(<TimerAdjuster time={60000} onStep={vi.fn()} onSnap={onSnap} />);

    await user.click(
      screen.getByRole("button", { name: "Arredondar para baixo" }),
    );
    expect(onSnap).toHaveBeenCalledWith("down");
  });

  it("calls onSnap with 'up' when rounding up", async () => {
    const onSnap = vi.fn();
    const user = userEvent.setup();
    render(<TimerAdjuster time={60000} onStep={vi.fn()} onSnap={onSnap} />);

    await user.click(
      screen.getByRole("button", { name: "Arredondar para cima" }),
    );
    expect(onSnap).toHaveBeenCalledWith("up");
  });
});

describe("AdjustActions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls onConfirm when Pronto is clicked", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(<AdjustActions onCancel={vi.fn()} onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "Pronto" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when Cancelar is clicked", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<AdjustActions onCancel={onCancel} onConfirm={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
