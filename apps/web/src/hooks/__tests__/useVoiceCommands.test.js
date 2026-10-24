import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVoiceCommands } from "@/hooks/useVoiceCommands.js";
import {
  FakeSpeechRecognition,
  FakeSpeechRecognitionPhrase,
} from "@/test/FakeSpeechRecognition.js";

async function renderVoiceCommands({ enabled = true } = {}) {
  const onStart = vi.fn();
  const onPause = vi.fn();
  const onStatusChange = vi.fn();
  const hook = renderHook(
    ({ enabled }) =>
      useVoiceCommands({
        onStart,
        onPause,
        onStatusChange,
        enabled,
        Recognition: FakeSpeechRecognition,
      }),
    { initialProps: { enabled } },
  );
  await act(async () => {});
  return { onStart, onPause, onStatusChange, ...hook };
}

function setVisibility(state) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("useVoiceCommands", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeSpeechRecognition.instances = [];
    FakeSpeechRecognition.available = undefined;
    vi.stubGlobal("SpeechRecognitionPhrase", FakeSpeechRecognitionPhrase);
    setVisibility("visible");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("starts the stopwatch on 'cronos play' and pauses on 'cronos pause'", async () => {
    const { onStart, onPause } = await renderVoiceCommands();

    FakeSpeechRecognition.last.say("cronos play");
    act(() => vi.advanceTimersByTime(0));
    FakeSpeechRecognition.last.say("cronos pause");

    expect(onStart).toHaveBeenCalledOnce();
    expect(onPause).toHaveBeenCalledOnce();
  });

  it("acts on an interim result without waiting for the final one", async () => {
    const { onPause } = await renderVoiceCommands();

    FakeSpeechRecognition.last.say("cronos pause", { isFinal: false });

    expect(onPause).toHaveBeenCalledOnce();
  });

  it("fires once while the same phrase keeps growing", async () => {
    const { onPause } = await renderVoiceCommands();
    const recognition = FakeSpeechRecognition.last;

    recognition.say("cronos pause", { isFinal: false });
    recognition.say("cronos pause agora", { isFinal: false });
    recognition.say("cronos pause agora", { isFinal: true });

    expect(onPause).toHaveBeenCalledOnce();
  });

  it("fires each command appended to a phrase that keeps growing", async () => {
    const { onStart, onPause } = await renderVoiceCommands();
    const recognition = FakeSpeechRecognition.last;

    recognition.say("cronos pausar", { isFinal: false });
    recognition.say("cronos pausar cronos iniciar", { isFinal: false });

    expect(onPause).toHaveBeenCalledOnce();
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("does not fire again when Chrome rewrites an earlier command", async () => {
    const { onStart, onPause } = await renderVoiceCommands();
    const recognition = FakeSpeechRecognition.last;

    recognition.say("cronos pausar", { isFinal: false });
    recognition.say("cronos iniciar", { isFinal: false });

    expect(onPause).toHaveBeenCalledOnce();
    expect(onStart).not.toHaveBeenCalled();
  });

  it("starts a fresh session after a command", async () => {
    await renderVoiceCommands();
    const recognition = FakeSpeechRecognition.last;

    recognition.say("cronos pause", { isFinal: false });
    act(() => vi.advanceTimersByTime(0));

    expect(recognition.aborted).toBe(true);
    expect(recognition.startCount).toBe(2);
  });

  it("fires again for the same command in a new phrase", async () => {
    const { onPause } = await renderVoiceCommands();
    const recognition = FakeSpeechRecognition.last;

    recognition.say("cronos pause", { index: 0 });
    recognition.say("cronos pause", { index: 1 });

    expect(onPause).toHaveBeenCalledTimes(2);
  });

  it("ignores speech without the wake word", async () => {
    const { onStart, onPause } = await renderVoiceCommands();

    FakeSpeechRecognition.last.say("play");

    expect(onStart).not.toHaveBeenCalled();
    expect(onPause).not.toHaveBeenCalled();
  });

  it("does not listen while disabled", async () => {
    await renderVoiceCommands({ enabled: false });

    expect(FakeSpeechRecognition.instances).toHaveLength(0);
  });

  it("aborts when disabled after starting", async () => {
    const { rerender } = await renderVoiceCommands();

    rerender({ enabled: false });

    expect(FakeSpeechRecognition.last.aborted).toBe(true);
  });

  it("restarts after the browser ends a silent session", async () => {
    await renderVoiceCommands();
    const recognition = FakeSpeechRecognition.last;

    recognition.fail("no-speech");
    act(() => vi.advanceTimersByTime(0));

    expect(recognition.startCount).toBe(2);
  });

  it("waits before restarting after a network error", async () => {
    await renderVoiceCommands();
    const recognition = FakeSpeechRecognition.last;

    recognition.fail("network");
    act(() => vi.advanceTimersByTime(999));
    expect(recognition.startCount).toBe(1);

    act(() => vi.advanceTimersByTime(1));
    expect(recognition.startCount).toBe(2);
  });

  it("stops for good when the microphone permission is denied", async () => {
    await renderVoiceCommands();
    const recognition = FakeSpeechRecognition.last;

    recognition.fail("not-allowed");
    act(() => vi.runAllTimers());

    expect(recognition.startCount).toBe(1);
  });

  it("reports a blocked microphone", async () => {
    const { onStatusChange } = await renderVoiceCommands();

    FakeSpeechRecognition.last.fail("not-allowed");

    expect(onStatusChange).toHaveBeenLastCalledWith("blocked");
  });

  it("retries when the browser refuses to restart", async () => {
    const { onStatusChange } = await renderVoiceCommands();
    const recognition = FakeSpeechRecognition.last;

    recognition.failNextStart = true;
    recognition.fail("no-speech");
    act(() => vi.advanceTimersByTime(0));
    expect(onStatusChange).toHaveBeenLastCalledWith("retrying");

    act(() => vi.advanceTimersByTime(1000));
    expect(recognition.startCount).toBe(3);
    expect(onStatusChange).toHaveBeenLastCalledWith("listening");
  });

  it("resumes listening when the page becomes visible again", async () => {
    await renderVoiceCommands();
    const recognition = FakeSpeechRecognition.last;

    setVisibility("hidden");
    recognition.onend();
    act(() => vi.runAllTimers());
    expect(recognition.startCount).toBe(1);

    setVisibility("visible");
    expect(recognition.startCount).toBe(2);
  });

  describe.skip("with an on-device model", () => {
    it("listens on device, biased toward the commands, once the model is installed", async () => {
      FakeSpeechRecognition.available = async () => "available";

      await renderVoiceCommands();
      const recognition = FakeSpeechRecognition.last;

      expect(recognition.processLocally).toBe(true);
      expect(recognition.phrases.map(({ phrase }) => phrase)).toContain(
        "cronos pausar",
      );
      expect(recognition.startCount).toBe(1);
    });

    it("stays online while the model is only downloadable", async () => {
      FakeSpeechRecognition.available = async () => "downloadable";

      await renderVoiceCommands();

      expect(FakeSpeechRecognition.last.processLocally).toBeUndefined();
    });

    it("drops the phrases when the model refuses them", async () => {
      FakeSpeechRecognition.available = async () => "available";
      await renderVoiceCommands();
      const recognition = FakeSpeechRecognition.last;

      recognition.fail("phrases-not-supported");

      expect(recognition.phrases).toEqual([]);
    });

    it("goes online when the model no longer has the language", async () => {
      FakeSpeechRecognition.available = async () => "available";
      await renderVoiceCommands();
      const recognition = FakeSpeechRecognition.last;

      recognition.fail("language-not-supported");

      expect(recognition.processLocally).toBe(false);
    });

    it("does not listen when disabled while the model is being checked", async () => {
      let resolveAvailability;
      FakeSpeechRecognition.available = () =>
        new Promise((resolve) => (resolveAvailability = resolve));
      const { rerender } = await renderVoiceCommands();

      rerender({ enabled: false });
      await act(async () => resolveAvailability("available"));

      expect(FakeSpeechRecognition.last.startCount).toBe(0);
    });
  });
});
