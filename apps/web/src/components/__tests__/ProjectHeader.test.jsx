import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { ProjectHeader } from "@/components/ProjectHeader.jsx";

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
        onReset={() => {}}
        canReset
        onOpenPiP={null}
        {...props}
      />
    </MemoryRouter>,
  );
}

async function openMenu() {
  await userEvent.click(screen.getByTitle("Mais opções"));
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
});
