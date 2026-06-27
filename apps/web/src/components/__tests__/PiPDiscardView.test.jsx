import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PiPDiscardView } from "@/components/PiPDiscardView.jsx";

describe("PiPDiscardView", () => {
  it("asks for confirmation", () => {
    render(<PiPDiscardView onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText(/Descartar tempo atual\?/i)).toBeTruthy();
  });

  it("calls onConfirm on Sim", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(<PiPDiscardView onConfirm={onConfirm} onCancel={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Sim" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel on Não", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<PiPDiscardView onConfirm={vi.fn()} onCancel={onCancel} />);
    await user.click(screen.getByRole("button", { name: "Não" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
