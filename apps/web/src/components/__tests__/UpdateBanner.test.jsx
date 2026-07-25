import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UpdateBanner } from "@/components/UpdateBanner.jsx";

describe("UpdateBanner", () => {
  it("calls onUpdate when the update button is clicked", async () => {
    const onUpdate = vi.fn();
    render(<UpdateBanner onUpdate={onUpdate} onDismiss={vi.fn()} />);

    await userEvent.click(screen.getByText("Atualizar"));

    expect(onUpdate).toHaveBeenCalledOnce();
  });

  it("calls onDismiss when the close button is clicked", async () => {
    const onDismiss = vi.fn();
    render(<UpdateBanner onUpdate={vi.fn()} onDismiss={onDismiss} />);

    await userEvent.click(screen.getByLabelText("Dispensar"));

    expect(onDismiss).toHaveBeenCalledOnce();
  });

  // Regression: as a toast it overlapped "+ Novo projeto" on the home page, so a
  // tap that dismissed it fell through to the button underneath. Asserted on the
  // class because jsdom loads no stylesheet for getComputedStyle to resolve.
  it("stays in the document flow instead of floating over the page", () => {
    const { container } = render(
      <UpdateBanner onUpdate={vi.fn()} onDismiss={vi.fn()} />,
    );

    expect(container.firstChild.className).not.toMatch(/\b(fixed|absolute)\b/);
  });
});
