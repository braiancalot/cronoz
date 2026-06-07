import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts.js";
import { ConfirmDialog } from "@/components/ConfirmDialog.jsx";

// Radix traps focus inside the open dialog, so Space fires from inside it —
// the real condition under test that the synthetic unit tests only simulate.
function Harness({ onToggle, dialogOpen }) {
  useKeyboardShortcuts({ onToggle });
  return (
    <ConfirmDialog
      open={dialogOpen}
      title="Apagar projeto?"
      description="Essa ação não pode ser desfeita."
      onConfirm={() => {}}
      onCancel={() => {}}
    />
  );
}

describe("useKeyboardShortcuts + ConfirmDialog (e2e)", () => {
  it("does not toggle when Space is pressed with the dialog open", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<Harness onToggle={onToggle} dialogOpen />);

    await screen.findByRole("dialog");
    await user.keyboard("[Space]");

    expect(onToggle).not.toHaveBeenCalled();
  });

  it("toggles when Space is pressed with no dialog open", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<Harness onToggle={onToggle} dialogOpen={false} />);

    await user.keyboard("[Space]");

    expect(onToggle).toHaveBeenCalledOnce();
  });
});
