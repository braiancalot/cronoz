import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt.js";

describe("useInstallPrompt", () => {
  let matchMediaMock;

  beforeEach(() => {
    localStorage.clear();

    matchMediaMock = vi.fn().mockReturnValue({ matches: false });
    vi.stubGlobal("matchMedia", matchMediaMock);
  });

  it("is not installable by default", () => {
    const { result } = renderHook(() => useInstallPrompt());

    expect(result.current.isInstallable).toBe(false);
  });

  it("becomes installable on beforeinstallprompt", () => {
    const { result } = renderHook(() => useInstallPrompt());

    const event = new Event("beforeinstallprompt");
    event.preventDefault = vi.fn();
    act(() => {
      window.dispatchEvent(event);
    });

    expect(result.current.isInstallable).toBe(true);
  });

  it("becomes not installable on appinstalled", () => {
    const { result } = renderHook(() => useInstallPrompt());

    const event = new Event("beforeinstallprompt");
    event.preventDefault = vi.fn();
    act(() => {
      window.dispatchEvent(event);
    });

    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });

    expect(result.current.isInstallable).toBe(false);
  });

  it("dismiss sets localStorage and clears prompt", () => {
    const { result } = renderHook(() => useInstallPrompt());

    const event = new Event("beforeinstallprompt");
    event.preventDefault = vi.fn();
    act(() => {
      window.dispatchEvent(event);
    });

    act(() => {
      result.current.dismiss();
    });

    expect(localStorage.getItem("cronoz-install-dismissed")).toBe("true");
    expect(result.current.isInstallable).toBe(false);
  });

  it("is not installable in standalone mode", () => {
    matchMediaMock.mockReturnValue({ matches: true });

    const { result } = renderHook(() => useInstallPrompt());

    expect(result.current.isInstallable).toBe(false);
  });

  it("promptInstall calls prompt() on the event", async () => {
    const { result } = renderHook(() => useInstallPrompt());

    const promptEvent = new Event("beforeinstallprompt");
    promptEvent.preventDefault = vi.fn();
    promptEvent.prompt = vi.fn();
    promptEvent.userChoice = Promise.resolve({ outcome: "accepted" });

    act(() => {
      window.dispatchEvent(promptEvent);
    });

    await act(async () => {
      await result.current.promptInstall();
    });

    expect(promptEvent.prompt).toHaveBeenCalledOnce();
  });
});
