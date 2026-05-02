import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Laps } from "@/components/Laps.jsx";

const mockLaps = [
  { id: "lap-1", name: "Lap #1", lapTime: 3000 },
  { id: "lap-2", name: "Lap #2", lapTime: 5000 },
];

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

    expect(container.querySelectorAll("[title='Renomear']")).toHaveLength(0);
  });

  it("opens rename input when edit button is clicked", async () => {
    render(
      <Laps laps={mockLaps} onRenameLap={vi.fn()} onDeleteLap={vi.fn()} />,
    );

    const editButtons = screen.getAllByTitle("Renomear");
    await userEvent.click(editButtons[0]);

    expect(screen.getByDisplayValue("Lap #1")).toBeInTheDocument();
  });

  it("calls onRenameLap on submit", async () => {
    const onRenameLap = vi.fn();
    render(
      <Laps laps={mockLaps} onRenameLap={onRenameLap} onDeleteLap={vi.fn()} />,
    );

    const editButtons = screen.getAllByTitle("Renomear");
    await userEvent.click(editButtons[0]);

    const input = screen.getByDisplayValue("Lap #1");
    await userEvent.clear(input);
    await userEvent.type(input, "Custom Name{Enter}");

    expect(onRenameLap).toHaveBeenCalledWith("lap-1", "Custom Name");
  });

  it("cancels rename on Escape", async () => {
    render(
      <Laps laps={mockLaps} onRenameLap={vi.fn()} onDeleteLap={vi.fn()} />,
    );

    const editButtons = screen.getAllByTitle("Renomear");
    await userEvent.click(editButtons[0]);

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

    const deleteButtons = screen.getAllByTitle("Deletar");
    await userEvent.click(deleteButtons[0]);

    expect(onDeleteLap).not.toHaveBeenCalled();

    const confirmButton = screen.getByRole("button", { name: "Apagar" });
    await userEvent.click(confirmButton);

    expect(onDeleteLap).toHaveBeenCalledWith("lap-1");
  });

  it("does not call onDeleteLap when deletion is cancelled", async () => {
    const onDeleteLap = vi.fn();
    render(
      <Laps laps={mockLaps} onRenameLap={vi.fn()} onDeleteLap={onDeleteLap} />,
    );

    const deleteButtons = screen.getAllByTitle("Deletar");
    await userEvent.click(deleteButtons[0]);

    const cancelButton = screen.getByRole("button", { name: "Cancelar" });
    await userEvent.click(cancelButton);

    expect(onDeleteLap).not.toHaveBeenCalled();
  });
});
