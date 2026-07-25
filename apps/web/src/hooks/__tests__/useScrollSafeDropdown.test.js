import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useScrollSafeDropdown } from "@/hooks/useScrollSafeDropdown.js";

describe("useScrollSafeDropdown", () => {
  it("starts closed and non-modal", () => {
    const { result } = renderHook(() => useScrollSafeDropdown());

    expect(result.current.menuProps.open).toBe(false);
    // Modal is what mounts RemoveScroll and freezes the list underneath.
    expect(result.current.menuProps.modal).toBe(false);
  });

  it("tracks the menu's own open changes", () => {
    const { result } = renderHook(() => useScrollSafeDropdown());

    act(() => result.current.menuProps.onOpenChange(true));

    expect(result.current.menuProps.open).toBe(true);
  });

  it("closes when the trigger's pointer is cancelled", () => {
    const { result } = renderHook(() => useScrollSafeDropdown());

    act(() => result.current.menuProps.onOpenChange(true));
    act(() => result.current.triggerProps.onPointerCancel());

    expect(result.current.menuProps.open).toBe(false);
  });
});
