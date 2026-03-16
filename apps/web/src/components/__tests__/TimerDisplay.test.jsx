import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TimerDisplay } from "@/components/TimerDisplay.jsx";

describe("TimerDisplay", () => {
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

  it("makes price invisible when running", () => {
    render(<TimerDisplay time={3600000} hourlyPrice={100} isRunning />);

    const price = screen.getByText("R$ 100,00");
    expect(price).toHaveClass("invisible");
  });

  it("shows totalTime separately when paused with totalTime prop", () => {
    const { container } = render(
      <TimerDisplay time={5000} totalTime={10000} />,
    );

    // The dot separator "•" shows when paused and totalTime is set
    expect(container.textContent).toContain("•");
  });

  it("does not show totalTime block when running", () => {
    const { container } = render(
      <TimerDisplay time={5000} totalTime={10000} isRunning />,
    );

    expect(container.textContent).not.toContain("•");
  });

  it("calculates price from totalTime when provided", () => {
    // totalTime 1h, hourlyPrice 50 → R$ 50,00
    render(<TimerDisplay time={0} totalTime={3600000} hourlyPrice={50} />);

    expect(screen.getByText("R$ 50,00")).toBeInTheDocument();
  });
});
