import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TimerAdjuster } from "@/components/timer/TimerAdjuster.jsx";
import { TimerAdjustSlot } from "@/components/timer/TimerAdjustSlot.jsx";

function stepperShape(container) {
  return [...container.querySelectorAll("button")].map(
    (button) => `${button.getAttribute("aria-label")} ${button.className}`,
  );
}

function renderSlot(props = {}) {
  return render(
    <TimerAdjustSlot layout="flank" size="default" {...props}>
      <span>o timer</span>
    </TimerAdjustSlot>,
  );
}

describe("TimerAdjustSlot", () => {
  it.each(["flank", "row"])(
    "reserves the %s adjuster's chrome down to the button classes",
    (layout) => {
      const slot = renderSlot({ layout });
      const adjuster = render(
        <TimerAdjuster
          time={5000}
          layout={layout}
          size="default"
          onStep={vi.fn()}
          onSnap={vi.fn()}
        />,
      );

      // Any divergence here is a footprint of the wrong height, which is what
      // moved the digits — and the laps under them — on entering adjust mode.
      expect(stepperShape(slot.container)).toEqual(
        stepperShape(adjuster.container),
      );
      expect(stepperShape(slot.container)).not.toHaveLength(0);
    },
  );

  it("holds the timer in the frame's own display slot", () => {
    renderSlot();

    // Not floated over the frame: an overlay would re-centre the digits, which
    // is exactly the movement the slot exists to prevent.
    expect(screen.getByText("o timer")).toBeInTheDocument();
  });

  it("veils the reserved chrome instead of dropping it", () => {
    const { container } = renderSlot();

    const veils = container.querySelectorAll("[aria-hidden='true'].invisible");
    expect(veils).toHaveLength(2);
    // `visibility` keeps the box; display:none or an absent node collapses it.
    expect(veils[0].querySelector("button")).toBeInTheDocument();
  });

  it("veils the single row as a whole, separator included", () => {
    const { container } = renderSlot({ layout: "row" });

    expect(
      container.querySelectorAll("[aria-hidden='true'].invisible"),
    ).toHaveLength(1);
    expect(container.querySelector("[data-slot='separator']")).toBeVisible();
  });

  it("keeps the reserved steppers out of the a11y tree", () => {
    renderSlot();

    expect(
      screen.queryByRole("button", { name: "Aumentar 10s" }),
    ).not.toBeInTheDocument();
  });

  it("borrows the mini stepper for the sliver, which has no size of its own", () => {
    const { container } = renderSlot({ size: "sliver" });

    // STEP_BTN has no sliver key: without the map the buttons render unsized.
    expect(container.querySelector("button")).toHaveClass("h-8", "w-9");
  });
});
