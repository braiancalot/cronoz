import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";

import { useLiveQuery } from "dexie-react-hooks";
import { copyWithToast } from "@/lib/clipboard.js";
import { useHidePrice } from "@/hooks/useHidePrice.js";
import { DEFAULT_STOPWATCH } from "@/services/projectRepository.js";
import LapsPage from "@/pages/LapsPage.jsx";

vi.mock("dexie-react-hooks", () => ({ useLiveQuery: vi.fn() }));
vi.mock("@/lib/clipboard.js", () => ({ copyWithToast: vi.fn() }));
vi.mock("@/hooks/useHidePrice.js", () => ({ useHidePrice: vi.fn() }));
vi.mock("@/hooks/useIgnoreMilliseconds.js", () => ({
  useIgnoreMilliseconds: () => false,
}));
vi.mock("@/providers/SettingsProvider.jsx", () => ({
  useHourlyPrice: () => 60,
}));

const HOUR = 3_600_000;

function projectWithLaps(laps) {
  return {
    id: "project-1",
    name: "Tapete",
    stopwatch: { ...DEFAULT_STOPWATCH, laps },
  };
}

function renderLapsPage() {
  return render(
    <MemoryRouter initialEntries={["/project/project-1/laps"]}>
      <Routes>
        <Route path="project/:id/laps" element={<LapsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function copySummary() {
  await userEvent.click(screen.getByRole("button", { name: /copiar resumo/i }));
  return copyWithToast.mock.calls.at(-1)[0];
}

describe("LapsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLiveQuery.mockReturnValue(
      projectWithLaps([{ id: "lap-1", name: "Base", lapTime: HOUR }]),
    );
  });

  it("copies the summary with the project's price", async () => {
    useHidePrice.mockReturnValue(false);
    renderLapsPage();

    const summary = await copySummary();

    expect(summary).toContain("1. Base (1h) 1h");
    expect(summary).toMatch(/Total 1h \(R\$\s60,00\)$/);
  });

  it("copies the summary without the price when prices are hidden", async () => {
    useHidePrice.mockReturnValue(true);
    renderLapsPage();

    expect(await copySummary()).toMatch(/Total 1h$/);
  });

  it("shows an empty state and nothing to copy without laps", () => {
    useHidePrice.mockReturnValue(false);
    useLiveQuery.mockReturnValue(projectWithLaps([]));
    renderLapsPage();

    expect(screen.getByText("Nenhuma volta ainda.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /copiar resumo/i }),
    ).toBeDisabled();
  });
});
