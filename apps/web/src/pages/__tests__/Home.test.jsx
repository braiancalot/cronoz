import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

import { useLiveQuery } from "dexie-react-hooks";
import projectRepository from "@/services/projectRepository.js";
import Home from "@/pages/Home.jsx";

vi.mock("dexie-react-hooks", () => ({ useLiveQuery: vi.fn() }));

vi.mock("@/services/projectRepository.js", () => ({
  default: {
    getAll: vi.fn(),
    create: vi.fn(),
    complete: vi.fn(),
    reopen: vi.fn(),
    remove: vi.fn(),
    undeleteProject: vi.fn(),
    addTag: vi.fn(),
    removeTag: vi.fn(),
  },
}));

vi.mock("@/components/AppHeader.jsx", () => ({
  AppHeader: () => <header>Cronoz</header>,
}));

vi.mock("@/lib/undoToast.js", () => ({
  showUndoToast: vi.fn(),
  UNDO_ON_LIST: {},
}));

function makeProject(id, name, tags, completedAt = null) {
  return {
    id,
    name,
    tags,
    completedAt,
    updatedAt: Number(id.slice(1)),
    stopwatch: {
      currentLapTime: 60_000,
      laps: [],
      isRunning: false,
      startTimestamp: null,
      lastActiveAt: null,
    },
  };
}

const PROJECTS = [
  makeProject("p3", "Tapete", ["Crochê"], 1),
  makeProject("p2", "Cachecol", ["Presente"]),
  makeProject("p1", "Bolsa", ["Crochê", "Encomenda"]),
];

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

describe("Home tags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useLiveQuery).mockReturnValue(PROJECTS);
    vi.mocked(projectRepository.addTag).mockResolvedValue(undefined);
  });

  it("unions tag filters and intersects the completed filter", async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole("button", { name: "Crochê" }));

    expect(screen.getByRole("link", { name: "Bolsa" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tapete" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Cachecol" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Concluídos" }));

    expect(
      screen.queryByRole("link", { name: "Bolsa" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tapete" })).toBeInTheDocument();
  });

  it("opens tag registration from the card and updates optimistically", async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getAllByTitle("Mais opções")[0]);
    await user.click(await screen.findByRole("menuitem", { name: "Tags" }));
    await user.type(
      screen.getByRole("textbox", { name: "Adicionar tag" }),
      "Urgente",
    );
    await user.click(screen.getByRole("button", { name: "Criar “Urgente”" }));

    expect(projectRepository.addTag).toHaveBeenCalledWith({
      id: "p2",
      name: "Urgente",
    });
    expect(
      screen.getByRole("button", { name: "Remover tag Urgente" }),
    ).toBeInTheDocument();
  });
});
