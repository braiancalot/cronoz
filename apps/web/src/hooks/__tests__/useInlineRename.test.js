import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useInlineRename } from "@/hooks/useInlineRename.js";

describe("useInlineRename", () => {
  it("displays the current name when idle", () => {
    const { result } = renderHook(() => useInlineRename("Old", vi.fn()));

    expect(result.current.displayName).toBe("Old");
    expect(result.current.isEditing).toBe(false);
  });

  it("start enters editing and seeds the draft", () => {
    const { result } = renderHook(() => useInlineRename("Old", vi.fn()));

    act(() => result.current.start());

    expect(result.current.isEditing).toBe(true);
    expect(result.current.draft).toBe("Old");
  });

  it("submit shows the new value optimistically before the prop catches up", async () => {
    const onRename = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useInlineRename("Old", onRename));

    act(() => result.current.start());
    act(() => result.current.setDraft("New"));
    await act(async () => {
      await result.current.submit();
    });

    // Prop is still "Old", but display already shows "New" — no flash.
    expect(result.current.displayName).toBe("New");
    expect(result.current.isEditing).toBe(false);
    expect(onRename).toHaveBeenCalledWith("New");
  });

  it("does not regress to the old name while the prop is stale", async () => {
    const onRename = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ name }) => useInlineRename(name, onRename),
      { initialProps: { name: "Old" } },
    );

    act(() => result.current.start());
    act(() => result.current.setDraft("New"));
    await act(async () => {
      await result.current.submit();
    });

    // A re-render with the still-stale prop must keep showing "New".
    rerender({ name: "Old" });
    expect(result.current.displayName).toBe("New");
  });

  it("reconciles when the prop catches up to the saved value", async () => {
    const onRename = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ name }) => useInlineRename(name, onRename),
      { initialProps: { name: "Old" } },
    );

    act(() => result.current.start());
    act(() => result.current.setDraft("New"));
    await act(async () => {
      await result.current.submit();
    });

    rerender({ name: "New" });
    expect(result.current.displayName).toBe("New");
  });

  it("follows a divergent external change instead of sticking on the optimistic value", async () => {
    const onRename = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ name }) => useInlineRename(name, onRename),
      { initialProps: { name: "Old" } },
    );

    act(() => result.current.start());
    act(() => result.current.setDraft("New"));
    await act(async () => {
      await result.current.submit();
    });

    // Sync brings a different value mid-flight → truth wins.
    rerender({ name: "FromSync" });
    expect(result.current.displayName).toBe("FromSync");
  });

  it("submit with empty draft does nothing", async () => {
    const onRename = vi.fn();
    const { result } = renderHook(() => useInlineRename("Old", onRename));

    act(() => result.current.start());
    act(() => result.current.setDraft(""));
    await act(async () => {
      await result.current.submit();
    });

    expect(onRename).not.toHaveBeenCalled();
    expect(result.current.displayName).toBe("Old");
  });

  it("cancel exits editing without calling onRename", () => {
    const onRename = vi.fn();
    const { result } = renderHook(() => useInlineRename("Old", onRename));

    act(() => result.current.start());
    act(() => result.current.cancel());

    expect(result.current.isEditing).toBe(false);
    expect(onRename).not.toHaveBeenCalled();
    expect(result.current.displayName).toBe("Old");
  });
});
