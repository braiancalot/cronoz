import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ProjectCard } from "@/components/ProjectCard.jsx";

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
