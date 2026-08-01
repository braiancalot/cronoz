import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useTapOnlyDropdown } from "@/hooks/useTapOnlyDropdown.js";

describe("useTapOnlyDropdown", () => {
  it("starts closed and modal", () => {
    const { result } = renderHook(() => useTapOnlyDropdown());

    expect(result.current.menuProps.open).toBe(false);
    // Modal is Radix's default and the reason a tap outside can't reach what
    // is under the menu — the hook must not opt out of it.
    expect(result.current.menuProps.modal).toBeUndefined();
  });

  it("bars the pointer-down that Radix would open on", () => {
    const { result } = renderHook(() => useTapOnlyDropdown());
    const event = { preventDefault: vi.fn() };

    act(() => result.current.triggerProps.onPointerDown(event));

    expect(event.preventDefault).toHaveBeenCalled();
    expect(result.current.menuProps.open).toBe(false);
  });

  it("toggles open on each click", () => {
    const { result } = renderHook(() => useTapOnlyDropdown());

    act(() => result.current.triggerProps.onClick());

    expect(result.current.menuProps.open).toBe(true);

    act(() => result.current.triggerProps.onClick());

    expect(result.current.menuProps.open).toBe(false);
  });

  it("tracks the menu's own open changes", () => {
    const { result } = renderHook(() => useTapOnlyDropdown());

    act(() => result.current.menuProps.onOpenChange(true));

    expect(result.current.menuProps.open).toBe(true);
  });
});
