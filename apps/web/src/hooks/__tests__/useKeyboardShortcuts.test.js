import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts.js";

describe("useKeyboardShortcuts", () => {
  it("calls onToggle when Space is pressed", () => {
    const onToggle = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onToggle }));

    document.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Space", bubbles: true }),
    );

    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("ignores Space when target is an INPUT", () => {
    const onToggle = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onToggle }));

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Space", bubbles: true }),
    );
    document.body.removeChild(input);

    expect(onToggle).not.toHaveBeenCalled();
  });

  it("ignores Space when target is a TEXTAREA", () => {
    const onToggle = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onToggle }));

    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Space", bubbles: true }),
    );
    document.body.removeChild(textarea);

    expect(onToggle).not.toHaveBeenCalled();
  });

  it("does not call onToggle for other keys", () => {
    const onToggle = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onToggle }));

    document.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Enter", bubbles: true }),
    );

    expect(onToggle).not.toHaveBeenCalled();
  });

  it("removes listener on unmount", () => {
    const onToggle = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcuts({ onToggle }));

    unmount();

    document.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Space", bubbles: true }),
    );

    expect(onToggle).not.toHaveBeenCalled();
  });
});
