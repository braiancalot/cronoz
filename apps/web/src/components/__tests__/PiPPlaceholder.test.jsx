import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PiPPlaceholder } from "@/components/PiPPlaceholder.jsx";

describe("PiPPlaceholder", () => {
  it("explains that the timer is in the floating window", () => {
    render(<PiPPlaceholder onClose={vi.fn()} />);
    expect(screen.getByText(/janela flutuante/i)).toBeTruthy();
  });

  it("calls onClose when the block is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<PiPPlaceholder onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: /trazer de volta/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when clicking the message, not just the label", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<PiPPlaceholder onClose={onClose} />);
    await user.click(screen.getByText(/janela flutuante/i));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
