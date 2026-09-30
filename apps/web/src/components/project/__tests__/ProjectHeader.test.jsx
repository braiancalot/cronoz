import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { MAX_PROJECT_NAME_LENGTH } from "@cronoz/shared";
import { ProjectHeader } from "@/components/project/ProjectHeader.jsx";

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
  it("shows the 'Tempo exato' item when onViewExactTime is provided", async () => {
    renderHeader({ onViewExactTime: () => {} });
    await openMenu();

    expect(screen.getByText("Tempo exato")).toBeInTheDocument();
  });

  it("hides the 'Tempo exato' item when onViewExactTime is absent", async () => {
    renderHeader({ onViewExactTime: null });
    await openMenu();

    // Sanity that the menu actually opened before asserting absence.
    expect(screen.getByText("Ajustar tempo")).toBeInTheDocument();
    expect(screen.queryByText("Tempo exato")).not.toBeInTheDocument();
  });

  it("calls onViewExactTime when the item is selected", async () => {
    const onViewExactTime = vi.fn();
    renderHeader({ onViewExactTime });
    await openMenu();

    await userEvent.click(screen.getByText("Tempo exato"));

    expect(onViewExactTime).toHaveBeenCalledOnce();
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
