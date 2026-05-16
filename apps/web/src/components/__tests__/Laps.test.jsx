import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Laps } from "@/components/Laps.jsx";

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

  it("calls onDeleteLap after confirming deletion", async () => {
    const onDeleteLap = vi.fn();
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
