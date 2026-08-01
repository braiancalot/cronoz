import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
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

function CurrentPath() {
  return <span data-testid="path">{useLocation().pathname}</span>;
}

function renderCard(project) {
  return render(
    <MemoryRouter>
      <ProjectCard
        project={project}
        onToggleComplete={() => {}}
        onDelete={() => {}}
      />
      <CurrentPath />
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

describe("ProjectCard menu", () => {
  it("opens on a tap without following the card's link", async () => {
    renderCard(makeProject({ isRunning: false }));

    await userEvent.click(screen.getByTitle("Mais opções"));

    expect(
      await screen.findByRole("menuitem", { name: "Concluir" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("path")).toHaveTextContent(/^\/$/);
  });

  it("does not open on pointer-down alone", async () => {
    renderCard(makeProject({ isRunning: false }));

    fireEvent.pointerDown(screen.getByTitle("Mais opções"));

    await waitFor(() =>
      expect(
        screen.queryByRole("menuitem", { name: "Concluir" }),
      ).not.toBeInTheDocument(),
    );
  });

  // The menu trigger used to sit inside the row's Link, so pressing it also
  // hit-tested as pressing the link — the whole card flashed :active.
  it("sits outside the row link, not nested inside it", () => {
    const { container } = renderCard(makeProject({ isRunning: false }));

    const link = container.querySelector("a");
    const trigger = screen.getByTitle("Mais opções");

    expect(link).not.toBeNull();
    expect(link.contains(trigger)).toBe(false);
  });

  it("dims the menu trigger at rest and darkens it on touch", () => {
    renderCard(makeProject({ isRunning: false }));

    expect(screen.getByTitle("Mais opções")).toHaveClass(
      "text-muted-foreground",
      "active:text-foreground",
    );
  });
});

describe("ProjectCard row link", () => {
  it("names the link after the project instead of leaving it empty", () => {
    renderCard(makeProject({ isRunning: false }));

    expect(screen.getByRole("link", { name: "Projeto A" })).toBeInTheDocument();
  });
});
