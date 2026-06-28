import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

function makeFakeWindow() {
  return {
    document: document.implementation.createHTMLDocument(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    close: vi.fn(),
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
});
