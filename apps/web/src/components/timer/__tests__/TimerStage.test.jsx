import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TimerStage } from "@/components/timer/TimerStage.jsx";
import {
  CONTROL_SIZES,
  CONTROL_ICONS,
} from "@/components/timer/TimerControls.jsx";
import { TIMER_GAP } from "@/components/timer/stageLayout.js";
import { TOAST_BAND } from "@/lib/toastBand.js";

const lapsProps = {
  laps: [{ id: "lap-1", name: "Primeira volta", lapTime: 3000 }],
  onRenameLap: vi.fn(),
  onDeleteLap: vi.fn(),
  isAddingLap: false,
  addLapName: "",
  onAddLapNameChange: vi.fn(),
  onConfirmAddLap: vi.fn(),
  onCancelAddLap: vi.fn(),
};

function renderStage(props = {}) {
  return render(
    <TimerStage
      layout="stacked"
      isAdjusting={false}
      time={5000}
      totalTime={null}
      isRunning={false}
      hourlyPrice={10}
      hasLapTime
      onStart={vi.fn()}
      onPause={vi.fn()}
      onAddLap={vi.fn()}
      lapsProps={lapsProps}
      hasLapsSection
      {...props}
    />,
  );
}

// The element the stage styles: the laps' own wrapper around the scroll area.
function lapsWrapper(container) {
  return container.querySelector("[data-slot='scroll-area']").parentElement;
}

describe("TimerStage", () => {
  it("shows the laps and the controls in the stacked layout", () => {
    renderStage();

    expect(screen.getByText("Primeira volta")).toBeInTheDocument();
    expect(screen.getByTitle("Iniciar")).toBeInTheDocument();
  });

  it("keeps the laps beside the controls in the inline layout", () => {
    renderStage({ layout: "inline" });

    expect(screen.getByText("Primeira volta")).toBeInTheDocument();
    expect(screen.getByTitle("Iniciar")).toBeInTheDocument();
  });

  it("drops the laps in the minimal layout so the page never scrolls", () => {
    renderStage({ layout: "minimal" });

    expect(screen.queryByText("Primeira volta")).not.toBeInTheDocument();
    expect(screen.getByTitle("Iniciar")).toBeInTheDocument();
    expect(screen.getByTitle("Volta")).toBeInTheDocument();
  });

  it("keeps the stacked controls together on a fixed gap", () => {
    renderStage();

    // Centred as a pair, not one per half of the column: at the column's full
    // width the halves pushed them to opposite edges.
    const row = screen.getByTitle("Iniciar").parentElement;
    expect(row).toHaveClass("flex", "justify-center", "gap-20");
  });

  it("caps the laps list so a long list scrolls instead of shoving the timer", () => {
    const { container } = renderStage();

    // The laps wrap the scroll area; that wrapper hugs a short list and caps
    // here, scrolling past it, so the centred group never grows unbounded.
    const scrollArea = container.querySelector("[data-slot='scroll-area']");
    expect(scrollArea.parentElement).toHaveClass("max-h-128");
  });

  it("rides the timer and laps as one centred group, timer held at its height", () => {
    const { container } = renderStage();

    // shrink-0 keeps a short viewport from squeezing the timer's total line
    // onto the laps; the group centres the pair with the leftover height.
    const section = container.querySelector("section");
    expect(section).toHaveClass("shrink-0");
    expect(section.parentElement).toHaveClass("justify-center");
    expect(section.parentElement).toHaveClass(
      ...TIMER_GAP.stacked.split(" "),
      TOAST_BAND,
    );
  });

  // Regression: a full laps list used to push the timer up under the toast,
  // which covered it. Both layouts that show laps have to reserve the band.
  it("reserves the toast's band above the timer in the inline layout", () => {
    const { container } = renderStage({ layout: "inline" });

    const timerRow = container.querySelector(`.${TOAST_BAND}`);
    expect(timerRow).not.toBeNull();
    const scrollArea = container.querySelector("[data-slot='scroll-area']");
    expect(scrollArea.parentElement).toHaveClass(TIMER_GAP.inline);
  });

  it("keeps the full-size timer on a wide-but-short minimal layout", () => {
    // Only a genuine sliver shrinks the timer; a wide viewport that merely lost
    // its laps keeps inline's size, so the inline→minimal step doesn't jump.
    const { container } = renderStage({ layout: "minimal", isSliver: false });

    const time = container.querySelector(".tabular-nums");
    expect(time).toHaveClass("text-[clamp(3.75rem,7vw,5.5rem)]");
  });

  it("shrinks the timer to the sliver size on a real split-screen", () => {
    const { container } = renderStage({ layout: "minimal", isSliver: true });

    const time = container.querySelector(".tabular-nums");
    expect(time).toHaveClass("text-[clamp(2rem,11vw,3.75rem)]");
  });

  it("keeps the minimal controls at the compact size, not the mini one", () => {
    renderStage({ layout: "minimal" });

    // The sliver is where they're hardest to hit; shrinking them there was a
    // regression once already.
    expect(screen.getByTitle("Iniciar")).toHaveClass("size-14");
  });

  it("sizes the control icon on the icon, not on the button", () => {
    renderStage();

    // Button's own [&_svg:not([class*='size-'])]:size-4 outranks any
    // [&_svg]:size-* on the button, so sizing there silently yields 16px.
    expect(screen.getByTitle("Iniciar").querySelector("svg")).toHaveClass(
      CONTROL_ICONS.default,
    );
  });

  it("lends the timer's row to the lap name form in the minimal layout", () => {
    renderStage({
      layout: "minimal",
      lapsProps: { ...lapsProps, isAddingLap: true, addLapName: "1º " },
    });

    expect(screen.getByRole("textbox")).toHaveValue("1º ");
    // Otherwise there'd be nowhere to name it, since the laps are hidden.
    expect(screen.queryByTitle("Iniciar")).not.toBeInTheDocument();
  });

  it("swaps the controls for a spacer while the PiP window holds the timer", () => {
    renderStage({ placeholder: <div>na janela flutuante</div> });

    expect(screen.getByText("na janela flutuante")).toBeInTheDocument();
    expect(screen.queryByTitle("Iniciar")).not.toBeInTheDocument();
    // The laps stay put — that spacer exists so nothing shifts on PiP toggle.
    expect(screen.getByText("Primeira volta")).toBeInTheDocument();
  });

  it.each(["stacked", "inline", "minimal"])(
    "keeps the timer's footprint under the %s PiP placeholder",
    (layout) => {
      const { container } = renderStage({
        layout,
        placeholder: <div>na janela flutuante</div>,
      });

      // A hidden timer sets the box and the placeholder floats over it: its
      // own height can't match a timer that rides a clamp on the viewport.
      const ghost = container.querySelector(".invisible");
      expect(ghost.querySelector(".tabular-nums")).toBeInTheDocument();
      expect(ghost).toHaveAttribute("aria-hidden");
      expect(screen.getByText("na janela flutuante").parentElement).toHaveClass(
        "absolute",
        "inset-0",
      );
    },
  );

  it("does not let the adjuster take over while the timer is in PiP", () => {
    renderStage({ isAdjusting: true, placeholder: <div>na janela</div> });

    expect(screen.getByText("na janela")).toBeInTheDocument();
    expect(screen.queryByTitle("Confirmar")).not.toBeInTheDocument();
  });

  it("gives the adjust actions the same footprint as the controls", () => {
    renderStage();
    expect(screen.getByTitle("Iniciar")).toHaveClass(CONTROL_SIZES.default);

    renderStage({ isAdjusting: true });

    // The buttons are what set the row's height, so a different size here
    // resizes the band above and the stage jumps on entering adjust mode.
    expect(screen.getByTitle("Pronto")).toHaveClass(CONTROL_SIZES.default);
  });

  it("dims the laps while running, since the overlay covers them", () => {
    const { container } = renderStage({ isRunning: true });

    expect(lapsWrapper(container)).toHaveClass("opacity-40");
  });

  it("brings the laps back to full opacity once paused", () => {
    const { container } = renderStage({ isRunning: false });

    expect(lapsWrapper(container)).not.toHaveClass("opacity-40");
  });

  it("keeps the laps lit while the PiP window holds the timer", () => {
    // No overlay on this page during PiP, so nothing is covered — dimming there
    // would just read as broken.
    const { container } = renderStage({
      isRunning: true,
      placeholder: <div>na janela flutuante</div>,
    });

    expect(lapsWrapper(container)).not.toHaveClass("opacity-40");
  });

  it.each(["stacked", "inline", "minimal"])(
    "leaves the %s controls row to the running overlay",
    (layout) => {
      // Only the buttons clear the overlay (TimerControls does that). Lifting
      // the row too would cover the column's width and its gap with an element
      // that has no handler, and a tap between the buttons would do nothing.
      renderStage({ layout, isRunning: true });

      expect(screen.getByTitle("Pausar").parentElement).not.toHaveClass("z-30");
    },
  );
});
