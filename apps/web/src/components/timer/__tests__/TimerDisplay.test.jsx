import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { toast } from "sonner";
import { TimerDisplay } from "@/components/timer/TimerDisplay.jsx";
import { SIZES } from "@/components/timer/timerDisplaySizes.js";

vi.mock("sonner", () => ({ toast: vi.fn() }));

const writeText = vi.fn().mockResolvedValue(undefined);
Object.defineProperty(window.Navigator.prototype, "clipboard", {
  value: { writeText },
  configurable: true,
});

describe("TimerDisplay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("renders formatted time with milliseconds", () => {
    const { container } = render(<TimerDisplay time={61000} />);

    // 01:01.00 — has dot separator for milliseconds
    const dotSeparator = container.querySelector("span.opacity-30");
    expect(dotSeparator).toBeInTheDocument();
  });

  it("renders price based on time and hourlyPrice", () => {
    // 1 hour = 3600000ms, hourlyPrice 100 → R$ 100,00
    render(<TimerDisplay time={3600000} hourlyPrice={100} />);

    expect(screen.getByText("R$ 100,00")).toBeInTheDocument();
  });

  it("fades the meta line when running, without giving up its space", () => {
    render(<TimerDisplay time={3600000} hourlyPrice={100} isRunning />);

    // Collapsing the row instead would shrink the timer, and everything under
    // it on the stage — the laps — would slide up on every play.
    const meta = screen.getByText("R$ 100,00").closest(".group");
    expect(meta).toHaveClass("opacity-0");
    expect(meta.className).not.toContain("grid-rows");
  });

  it("drifts the digits down while running, by transform only", () => {
    const { container } = render(<TimerDisplay time={3600000} isRunning />);

    // Transform is what keeps this off the layout: the digits take the space
    // the fading total leaves behind without moving anything below them.
    const digits = container.querySelector(".tabular-nums");
    expect(digits.closest(".transition-transform")).toHaveClass(
      SIZES.default.runningShift,
    );
  });

  it("holds the digits in place while paused", () => {
    const { container } = render(<TimerDisplay time={3600000} />);

    const digits = container.querySelector(".tabular-nums");
    expect(digits.closest(".transition-transform")).not.toHaveClass(
      SIZES.default.runningShift,
    );
  });

  it("shows totalTime separately when paused with totalTime prop", () => {
    const { container } = render(
      <TimerDisplay time={5000} totalTime={10000} />,
    );

    // The dot separator "•" shows when paused and totalTime is set
    expect(container.textContent).toContain("•");
  });

  it("fades the totalTime block when running", () => {
    render(<TimerDisplay time={5000} totalTime={10000} isRunning />);

    const separator = screen.getByText("•");
    expect(separator.closest(".group")).toHaveClass("opacity-0");
  });

  it("calculates price from totalTime when provided", () => {
    // totalTime 1h, hourlyPrice 50 → R$ 50,00
    render(<TimerDisplay time={0} totalTime={3600000} hourlyPrice={50} />);

    expect(screen.getByText("R$ 50,00")).toBeInTheDocument();
  });

  it("copies the time and toasts when clicked", async () => {
    const { container } = render(<TimerDisplay time={61000} />);

    fireEvent.click(container.querySelector(".cursor-pointer"));
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith("1m1s");
    expect(toast).toHaveBeenCalledOnce();
  });

  it("does not copy when enableCopy is false", async () => {
    const { container } = render(
      <TimerDisplay time={61000} enableCopy={false} />,
    );

    fireEvent.click(container.querySelector(".tabular-nums"));
    await Promise.resolve();

    expect(writeText).not.toHaveBeenCalled();
  });

  it("scales the default tier with viewport width, without a breakpoint step", () => {
    const { container } = render(<TimerDisplay time={61000} size="default" />);

    const time = container.querySelector(".tabular-nums");
    expect(time.className).toContain("7vw");
    expect(time.className).not.toContain("md:");
  });

  it("scales against the shorter axis when fluid is set (PiP)", () => {
    const { container } = render(
      <TimerDisplay time={61000} size="default" fluid />,
    );

    const time = container.querySelector(".tabular-nums");
    expect(time.className).toContain("vmin");
  });
});
