import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Laps } from "@/components/Laps.jsx";

async function startRename(lapIndex = 0) {
  const menuTriggers = screen.getAllByTitle("Mais opções");
  await userEvent.click(menuTriggers[lapIndex]);
  const renameItem = await screen.findByRole("menuitem", { name: "Renomear" });
  await userEvent.click(renameItem);
}

const mockLaps = [
  { id: "lap-1", name: "Lap #1", lapTime: 3000 },
  { id: "lap-2", name: "Lap #2", lapTime: 5000 },
];

async function openLapMenu(lapIndex) {
  const menuTriggers = screen.getAllByTitle("Mais opções");
  await userEvent.click(menuTriggers[lapIndex]);
}

describe("Laps", () => {
  it("renders all laps with their names", () => {
    render(
      <Laps laps={mockLaps} onRenameLap={vi.fn()} onDeleteLap={vi.fn()} />,
    );

    expect(screen.getByText("Lap #1")).toBeInTheDocument();
    expect(screen.getByText("Lap #2")).toBeInTheDocument();
  });

  it("renders empty when laps is empty", () => {
    const { container } = render(
      <Laps laps={[]} onRenameLap={vi.fn()} onDeleteLap={vi.fn()} />,
    );

    expect(container.querySelectorAll("[title='Mais opções']")).toHaveLength(0);
  });

  it("opens rename input when 'Renomear' is selected in the lap menu", async () => {
    render(
      <Laps laps={mockLaps} onRenameLap={vi.fn()} onDeleteLap={vi.fn()} />,
    );

    await openLapMenu(0);
    const renameItem = await screen.findByRole("menuitem", {
      name: "Renomear",
    });
    await userEvent.click(renameItem);

    expect(screen.getByDisplayValue("Lap #1")).toBeInTheDocument();
  });

  it("calls onRenameLap on submit", async () => {
    const onRenameLap = vi.fn();
    render(
      <Laps laps={mockLaps} onRenameLap={onRenameLap} onDeleteLap={vi.fn()} />,
    );

    await openLapMenu(0);
    const renameItem = await screen.findByRole("menuitem", {
      name: "Renomear",
    });
    await userEvent.click(renameItem);

    const input = screen.getByDisplayValue("Lap #1");
    await userEvent.clear(input);
    await userEvent.type(input, "Custom Name{Enter}");

    expect(onRenameLap).toHaveBeenCalledWith("lap-1", "Custom Name");
  });

  it("cancels rename on Escape", async () => {
    render(
      <Laps laps={mockLaps} onRenameLap={vi.fn()} onDeleteLap={vi.fn()} />,
    );

    await openLapMenu(0);
    const renameItem = await screen.findByRole("menuitem", {
      name: "Renomear",
    });
    await userEvent.click(renameItem);

    const input = screen.getByDisplayValue("Lap #1");
    await userEvent.keyboard("{Escape}");

    expect(input).not.toBeInTheDocument();
    expect(screen.getByText("Lap #1")).toBeInTheDocument();
  });

  it("saves the rename when the ✓ button is clicked", async () => {
    const onRenameLap = vi.fn();
    render(
      <Laps laps={mockLaps} onRenameLap={onRenameLap} onDeleteLap={vi.fn()} />,
    );

    await startRename(0);
    const input = screen.getByDisplayValue("Lap #1");
    await userEvent.clear(input);
    await userEvent.type(input, "Custom Name");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onRenameLap).toHaveBeenCalledWith("lap-1", "Custom Name");
  });

  it("cancels the rename when the ✕ button is clicked", async () => {
    const onRenameLap = vi.fn();
    render(
      <Laps laps={mockLaps} onRenameLap={onRenameLap} onDeleteLap={vi.fn()} />,
    );

    await startRename(0);
    const input = screen.getByDisplayValue("Lap #1");
    await userEvent.clear(input);
    await userEvent.type(input, "Discarded");
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onRenameLap).not.toHaveBeenCalled();
    expect(input).not.toBeInTheDocument();
    expect(screen.getByText("Lap #1")).toBeInTheDocument();
  });

  it("commits the rename when the field loses focus", async () => {
    const onRenameLap = vi.fn();
    render(
      <Laps laps={mockLaps} onRenameLap={onRenameLap} onDeleteLap={vi.fn()} />,
    );

    await startRename(0);
    const input = screen.getByDisplayValue("Lap #1");
    await userEvent.clear(input);
    await userEvent.type(input, "Custom Name");
    fireEvent.blur(input);

    expect(onRenameLap).toHaveBeenCalledWith("lap-1", "Custom Name");
  });

  it("discards the rename when the field loses focus while empty", async () => {
    const onRenameLap = vi.fn();
    render(
      <Laps laps={mockLaps} onRenameLap={onRenameLap} onDeleteLap={vi.fn()} />,
    );

    await startRename(0);
    const input = screen.getByDisplayValue("Lap #1");
    await userEvent.clear(input);
    fireEvent.blur(input);

    expect(onRenameLap).not.toHaveBeenCalled();
    expect(screen.getByText("Lap #1")).toBeInTheDocument();
  });

  it("confirms adding a lap when the ✓ button is clicked", async () => {
    const onConfirmAddLap = vi.fn();
    render(
      <Laps
        laps={mockLaps}
        onRenameLap={vi.fn()}
        onDeleteLap={vi.fn()}
        isAddingLap
        addLapName="3º Corte"
        onAddLapNameChange={vi.fn()}
        onConfirmAddLap={onConfirmAddLap}
        onCancelAddLap={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onConfirmAddLap).toHaveBeenCalled();
  });

  it("calls onDeleteLap after confirming deletion", async () => {
    const onDeleteLap = vi.fn().mockResolvedValue({ undo: vi.fn() });
    render(
      <Laps laps={mockLaps} onRenameLap={vi.fn()} onDeleteLap={onDeleteLap} />,
    );

    await openLapMenu(0);
    const deleteItem = await screen.findByRole("menuitem", { name: "Apagar" });
    await userEvent.click(deleteItem);

    expect(onDeleteLap).not.toHaveBeenCalled();

    const confirmButton = await screen.findByRole("button", { name: "Apagar" });
    await userEvent.click(confirmButton);

    expect(onDeleteLap).toHaveBeenCalledWith("lap-1");
  });

  it("copies a time without bubbling the click to a parent handler", async () => {
    const writeText = vi.fn().mockResolvedValue();
    Object.assign(navigator, { clipboard: { writeText } });
    const onParentClick = vi.fn();

    const { container } = render(
      <div onClick={onParentClick}>
        <Laps laps={mockLaps} onRenameLap={vi.fn()} onDeleteLap={vi.fn()} />
      </div>,
    );

    const [timeCell] = container.querySelectorAll(".cursor-pointer");
    await userEvent.click(timeCell);

    expect(writeText).toHaveBeenCalled();
    expect(onParentClick).not.toHaveBeenCalled();
  });

  it("does not call onDeleteLap when deletion is cancelled", async () => {
    const onDeleteLap = vi.fn();
    render(
      <Laps laps={mockLaps} onRenameLap={vi.fn()} onDeleteLap={onDeleteLap} />,
    );

    await openLapMenu(0);
    const deleteItem = await screen.findByRole("menuitem", { name: "Apagar" });
    await userEvent.click(deleteItem);

    const cancelButton = await screen.findByRole("button", {
      name: "Cancelar",
    });
    await userEvent.click(cancelButton);

    expect(onDeleteLap).not.toHaveBeenCalled();
  });
});
