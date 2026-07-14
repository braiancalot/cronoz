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

  it("ignores Space when a dialog is open", () => {
    const onToggle = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onToggle }));

    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    const button = document.createElement("button");
    dialog.appendChild(button);
    document.body.appendChild(dialog);
    button.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Space", bubbles: true }),
    );
    document.body.removeChild(dialog);

    expect(onToggle).not.toHaveBeenCalled();
  });

  it("ignores Space when a menu is open", () => {
    const onToggle = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onToggle }));

    const menu = document.createElement("div");
    menu.setAttribute("role", "menu");
    const item = document.createElement("div");
    item.setAttribute("role", "menuitem");
    menu.appendChild(item);
    document.body.appendChild(menu);
    item.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Space", bubbles: true }),
    );
    document.body.removeChild(menu);

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

  it("does not re-activate the focused button when toggling", () => {
    const onToggle = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onToggle }));

    const button = document.createElement("button");
    const buttonHandler = vi.fn();
    button.addEventListener("keydown", buttonHandler);
    document.body.appendChild(button);
    button.focus();

    button.dispatchEvent(
      new KeyboardEvent("keydown", {
        code: "Space",
        bubbles: true,
        cancelable: true,
      }),
    );

    document.body.removeChild(button);

    expect(onToggle).toHaveBeenCalledOnce();
    expect(buttonHandler).not.toHaveBeenCalled();
  });

  it("does not call onToggle when disabled (e.g. while adjusting time)", () => {
    const onToggle = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onToggle, enabled: false }));

    document.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Space", bubbles: true }),
    );

    expect(onToggle).not.toHaveBeenCalled();
  });

  it("calls onToggle when Space is pressed inside the PiP window", () => {
    const onToggle = vi.fn();
    const pipWindow = {
      document: document.implementation.createHTMLDocument(),
    };
    renderHook(() => useKeyboardShortcuts({ onToggle, pipWindow }));

    pipWindow.document.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Space", bubbles: true }),
    );

    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("stops listening to the PiP window after it closes", () => {
    const onToggle = vi.fn();
    const pipWindow = {
      document: document.implementation.createHTMLDocument(),
    };
    const { rerender } = renderHook(
      ({ win }) => useKeyboardShortcuts({ onToggle, pipWindow: win }),
      { initialProps: { win: pipWindow } },
    );

    rerender({ win: null });

    pipWindow.document.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Space", bubbles: true }),
    );

    expect(onToggle).not.toHaveBeenCalled();
  });
});
