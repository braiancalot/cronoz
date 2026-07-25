import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ProjectCard } from "@/components/project/ProjectCard.jsx";

function makeProject(stopwatch) {
  return {
    id: "p1",
    name: "Projeto A",
    completedAt: null,
    updatedAt: Date.now(),
    stopwatch: { currentLapTime: 0, laps: [], ...stopwatch },
  };
}

function renderCard(project) {
  return render(
    <MemoryRouter>
      <ProjectCard
        project={project}
        onToggleComplete={() => {}}
        onDelete={() => {}}
      />
    </MemoryRouter>,
  );
}

const LIVE_LABEL = "Ativo em outro dispositivo";

describe("ProjectCard box", () => {
  it("stays one step above a lap card instead of towering over it", () => {
    const { container } = renderCard(makeProject({ isRunning: false }));

    // Both rows carry the same content and the same size-9 menu; the card kept
    // the size="sm" preset's py-4 and stood 70% taller than a lap.
    const card = container.querySelector("[data-slot='card']");
    expect(card).toHaveClass("py-2", "rounded-xl");
  });

  it("keeps the padding on a class the merge can override", () => {
    const { container } = renderCard(makeProject({ isRunning: false }));

    // size="sm" spells its padding as data-[size=sm]:py-4 — an attribute
    // selector that outranks a plain py-2 and that cn() won't dedupe. The rule
    // ships in the base class list either way; only data-size keeps it inert.
    const card = container.querySelector("[data-slot='card']");
    expect(card).toHaveAttribute("data-size", "default");
  });
});

describe("ProjectCard live indicator", () => {
  it("shows the indicator when running with a fresh heartbeat", () => {
    renderCard(
      makeProject({
        isRunning: true,
        startTimestamp: Date.now() - 5000,
        lastActiveAt: Date.now(),
      }),
    );

    expect(screen.getByLabelText(LIVE_LABEL)).toBeInTheDocument();
  });

  it("hides the indicator when paused", () => {
    renderCard(
      makeProject({
        isRunning: false,
        startTimestamp: null,
        lastActiveAt: null,
      }),
    );

    expect(screen.queryByLabelText(LIVE_LABEL)).not.toBeInTheDocument();
  });

  it("hides the indicator when the heartbeat is stale", () => {
    renderCard(
      makeProject({
        isRunning: true,
        startTimestamp: Date.now() - 120000,
        lastActiveAt: Date.now() - 60000,
      }),
    );

    expect(screen.queryByLabelText(LIVE_LABEL)).not.toBeInTheDocument();
  });
});
