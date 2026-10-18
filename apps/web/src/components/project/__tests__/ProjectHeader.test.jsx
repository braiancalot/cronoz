import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { MAX_PROJECT_NAME_LENGTH } from "@cronoz/shared";
import { ProjectHeader } from "@/components/project/ProjectHeader.jsx";
import { REAL_TIME_STATUS } from "@/lib/realTime.js";

function renderHeader(props = {}) {
  return render(
    <MemoryRouter>
      <ProjectHeader
        name="Projeto"
        onRename={() => {}}
        onDelete={() => {}}
        onDiscardCurrentTime={() => {}}
        canDiscardCurrentTime
        onAdjust={() => {}}
        canAdjust
        onOpenPiP={null}
        {...props}
      />
    </MemoryRouter>,
  );
}

async function openMenu() {
  await userEvent.click(screen.getByTitle("Mais opções"));
}

async function startRename() {
  await openMenu();
  await userEvent.click(
    await screen.findByRole("menuitem", { name: "Renomear" }),
  );
}

describe("ProjectHeader", () => {
  function realTimeItem() {
    return screen.getByRole("menuitem", { name: /Tempo real/ });
  }

  it("calls onViewRealTime when the item is selected on a tracked project", async () => {
    const onViewRealTime = vi.fn();
    renderHeader({ onViewRealTime, realTimeStatus: REAL_TIME_STATUS.tracked });
    await openMenu();

    await userEvent.click(realTimeItem());

    expect(onViewRealTime).toHaveBeenCalledOnce();
  });

  it("disables the item on a project from before the feature, saying why", async () => {
    const onViewRealTime = vi.fn();
    renderHeader({
      onViewRealTime,
      realTimeStatus: REAL_TIME_STATUS.untracked,
    });
    await openMenu();

    expect(realTimeItem()).toHaveAttribute("data-disabled");
    expect(
      screen.getByText("Indisponível em projetos antigos"),
    ).toBeInTheDocument();
  });

  it("disables the item when an older build left the times out of step", async () => {
    renderHeader({
      onViewRealTime: () => {},
      realTimeStatus: REAL_TIME_STATUS.inconsistent,
    });
    await openMenu();

    expect(realTimeItem()).toHaveAttribute("data-disabled");
    expect(
      screen.getByText("Alterado por uma versão antiga do app"),
    ).toBeInTheDocument();
  });

  it("shows no reason on an available item", async () => {
    renderHeader({
      onViewRealTime: () => {},
      realTimeStatus: REAL_TIME_STATUS.tracked,
    });
    await openMenu();

    expect(realTimeItem()).not.toHaveAttribute("data-disabled");
    expect(realTimeItem()).toHaveTextContent(/^Tempo real$/);
  });

  it("truncates a long title instead of pushing the menu off the row", () => {
    renderHeader({
      name: "Tradução do manual técnico completo do equipamento",
    });

    // min-w-0 is half the fix: without it the h1 won't shrink past its longest
    // word as a flex item, and truncate never fires.
    const heading = screen.getByRole("heading");
    expect(heading).toHaveClass("truncate", "min-w-0");
    expect(heading.parentElement).toHaveClass("min-w-0");
  });

  it("caps the rename field at the sync limit", async () => {
    renderHeader();

    await startRename();
    expect(screen.getByDisplayValue("Projeto")).toHaveAttribute(
      "maxLength",
      String(MAX_PROJECT_NAME_LENGTH),
    );
  });

  it("saves the rename when the ✓ button is clicked", async () => {
    const onRename = vi.fn();
    renderHeader({ onRename });

    await startRename();
    const input = screen.getByDisplayValue("Projeto");
    await userEvent.clear(input);
    await userEvent.type(input, "Novo nome");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onRename).toHaveBeenCalledWith("Novo nome");
  });

  it("cancels the rename when the ✕ button is clicked", async () => {
    const onRename = vi.fn();
    renderHeader({ onRename });

    await startRename();
    const input = screen.getByDisplayValue("Projeto");
    await userEvent.clear(input);
    await userEvent.type(input, "Descartado");
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onRename).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Projeto" }),
    ).toBeInTheDocument();
  });

  it("commits the rename when the field loses focus", async () => {
    const onRename = vi.fn();
    renderHeader({ onRename });

    await startRename();
    const input = screen.getByDisplayValue("Projeto");
    await userEvent.clear(input);
    await userEvent.type(input, "Novo nome");
    fireEvent.blur(input);

    expect(onRename).toHaveBeenCalledWith("Novo nome");
  });
});
