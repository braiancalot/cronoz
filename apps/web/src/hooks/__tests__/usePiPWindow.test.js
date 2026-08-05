import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

function makeFakeWindow() {
  const listeners = {};
  return {
    document: document.implementation.createHTMLDocument(),
    addEventListener: vi.fn((type, handler) => {
      listeners[type] = handler;
    }),
    removeEventListener: vi.fn((type) => {
      delete listeners[type];
    }),
    close: vi.fn(),
    emit: (type) => listeners[type]?.(),
  };
}

describe("usePiPWindow", () => {
  let fakeWin;
  let usePiPWindow;

  beforeEach(async () => {
    fakeWin = makeFakeWindow();
    vi.stubGlobal("documentPictureInPicture", {
      requestWindow: vi.fn().mockResolvedValue(fakeWin),
    });
    vi.resetModules();
    ({ usePiPWindow } = await import("@/hooks/usePiPWindow.js"));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("closes the PiP window when the owning component unmounts", async () => {
    const { result, unmount } = renderHook(() => usePiPWindow());

    await act(async () => {
      await result.current.openPiP();
    });

    expect(fakeWin.close).not.toHaveBeenCalled();

    unmount();

    expect(fakeWin.close).toHaveBeenCalledOnce();
  });

  it("calls onClose when closePiP is called", async () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => usePiPWindow(onClose));

    await act(async () => {
      await result.current.openPiP();
    });
    act(() => result.current.closePiP());

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when the PiP window is closed by the user", async () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => usePiPWindow(onClose));

    await act(async () => {
      await result.current.openPiP();
    });
    act(() => fakeWin.emit("pagehide"));

    expect(onClose).toHaveBeenCalledOnce();
    expect(result.current.pipWindow).toBeNull();
  });

  it("does not call onClose on unmount", async () => {
    const onClose = vi.fn();
    const { result, unmount } = renderHook(() => usePiPWindow(onClose));

    await act(async () => {
      await result.current.openPiP();
    });
    unmount();

    expect(onClose).not.toHaveBeenCalled();
  });
});
