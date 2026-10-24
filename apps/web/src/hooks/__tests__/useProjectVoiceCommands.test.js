import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { VOICE_COMMANDS_KEY } from "@cronoz/shared";
import { useProjectVoiceCommands } from "@/hooks/useProjectVoiceCommands.js";
import db from "@/services/db.js";
import internalRepository from "@/services/internalRepository.js";
import { FakeSpeechRecognition } from "@/test/FakeSpeechRecognition.js";

async function renderListening({ isAdjusting = false } = {}) {
  const hook = renderHook(
    ({ isAdjusting }) =>
      useProjectVoiceCommands({
        onStart: vi.fn(),
        onPause: vi.fn(),
        isAdjusting,
      }),
    { initialProps: { isAdjusting } },
  );
  await waitFor(() => expect(hook.result.current.status).toBe("listening"));
  return hook;
}

describe("useProjectVoiceCommands", () => {
  beforeEach(async () => {
    FakeSpeechRecognition.instances = [];
    vi.stubGlobal("webkitSpeechRecognition", FakeSpeechRecognition);
    await db.internal.clear();
    await internalRepository.set(VOICE_COMMANDS_KEY, true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shows a phrase that calls the wake word", async () => {
    const { result } = await renderListening();

    act(() => FakeSpeechRecognition.last.say("cronos pausar"));

    expect(result.current.message).toEqual({
      text: "cronos pausar",
      isUnknown: false,
    });
  });

  it("shows nothing for speech without the wake word", async () => {
    const { result } = await renderListening();

    act(() => FakeSpeechRecognition.last.say("vou pausar o vídeo"));

    expect(result.current.message).toBeNull();
  });

  it("flags an unknown command only once the phrase is final", async () => {
    const { result } = await renderListening();
    const recognition = FakeSpeechRecognition.last;

    act(() => recognition.say("cronos desliga", { isFinal: false }));
    expect(result.current.message.isUnknown).toBe(false);

    act(() => recognition.say("cronos desliga"));
    expect(result.current.message.isUnknown).toBe(true);
  });

  it("clears the phrase after a while", async () => {
    const { result } = await renderListening();
    vi.useFakeTimers();

    act(() => FakeSpeechRecognition.last.say("cronos desliga"));
    act(() => vi.advanceTimersByTime(2500));

    expect(result.current.message).toBeNull();
  });

  it("stops listening while the time is being adjusted", async () => {
    const { rerender } = await renderListening();

    rerender({ isAdjusting: true });

    expect(FakeSpeechRecognition.last.aborted).toBe(true);
  });
});
