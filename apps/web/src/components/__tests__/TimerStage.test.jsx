import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TimerStage } from "@/components/TimerStage.jsx";
import { CONTROL_SIZES, CONTROL_ICONS } from "@/components/TimerControls.jsx";

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
    expect(row).toHaveClass("flex", "justify-center", "gap-12");
  });

  it("caps the laps at half the group so they can't crowd out the timer", () => {
    const { container } = renderStage();

    const card = container.querySelector("[data-slot='card']");
    expect(card).toHaveClass("max-h-[min(24rem,100%)]");
    // Without items-start the card stretched to the whole band and a short list
    // rendered with a hole under its rows.
    expect(card.parentElement.parentElement).toHaveClass(
      "basis-1/2",
      "items-start",
    );
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

  it("does not let the adjuster take over while the timer is in PiP", () => {
    renderStage({ isAdjusting: true, placeholder: <div>na janela</div> });

    expect(screen.getByText("na janela")).toBeInTheDocument();
    expect(screen.queryByTitle("Confirmar")).not.toBeInTheDocument();
  });

  it("pauses on a background click only while running", () => {
    const onPause = vi.fn();
    const { container, rerender } = renderStage({ isRunning: true, onPause });

    container.querySelector("section").click();
    expect(onPause).toHaveBeenCalledOnce();

    rerender(
      <TimerStage
        layout="stacked"
        isAdjusting={false}
        time={5000}
        totalTime={null}
        isRunning={false}
        hourlyPrice={10}
        hasLapTime
        onStart={vi.fn()}
        onPause={onPause}
        onAddLap={vi.fn()}
        lapsProps={lapsProps}
        hasLapsSection
      />,
    );
    container.querySelector("section").click();
    expect(onPause).toHaveBeenCalledOnce();
  });

  it("gives the adjust actions the same footprint as the controls", () => {
    renderStage();
    expect(screen.getByTitle("Iniciar")).toHaveClass(CONTROL_SIZES.default);

    renderStage({ isAdjusting: true });

    // The buttons are what set the row's height, so a different size here
    // resizes the band above and the stage jumps on entering adjust mode.
    expect(screen.getByTitle("Pronto")).toHaveClass(CONTROL_SIZES.default);
  });

  it("pauses on a click in the bare space of the laps band", () => {
    const onPause = vi.fn();
    const { container } = renderStage({ isRunning: true, onPause });

    // The band is half the stage; with a short list most of it is backdrop, and
    // it read as dead to the touch while the timer's own half paused fine.
    container.querySelector("section").nextElementSibling.click();
    expect(onPause).toHaveBeenCalledOnce();
  });

  it("pauses on a click below the inline laps", () => {
    const onPause = vi.fn();
    const { container } = renderStage({
      layout: "inline",
      isRunning: true,
      onPause,
    });

    container.firstChild.lastElementChild.click();
    expect(onPause).toHaveBeenCalledOnce();
  });

  it("does not pause when a lap row is clicked", () => {
    const onPause = vi.fn();
    renderStage({ isRunning: true, onPause });

    // The lap times stop propagation; the name doesn't, so a handler on the
    // stage's outer container caught it and tapping a name paused the timer.
    screen.getByText("Primeira volta").click();
    expect(onPause).not.toHaveBeenCalled();
  });
});
