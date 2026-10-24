import { describe, it, expect } from "vitest";
import {
  isUnknownCommand,
  matchVoiceCommands,
  soundsLike,
} from "@/lib/voiceCommands.js";

describe("matchVoiceCommands", () => {
  it.each([
    ["cronos play", "start"],
    ["Cronos, iniciar.", "start"],
    ["cronoz começar", "start"],
    ["Kronos continuar", "start"],
    ["cronos plei", "start"],
    ["cronos pause", "pause"],
    ["Cronos pausar", "pause"],
    ["chronos parar", "pause"],
    ["crono stop", "pause"],
  ])("maps %j to %s", (transcript, command) => {
    expect(matchVoiceCommands(transcript)).toEqual([command]);
  });

  it.each(["cronus", "cromos", "Krono", "Chronus"])(
    "accepts %j as the wake word",
    (wakeWord) => {
      expect(matchVoiceCommands(`${wakeWord} play`)).toEqual(["start"]);
    },
  );

  it.each(["pose", "pós", "pousi", "pauze"])(
    "accepts %j as pause",
    (pauseWord) => {
      expect(matchVoiceCommands(`cronos ${pauseWord}`)).toEqual(["pause"]);
    },
  );

  it("ignores a command without the wake word", () => {
    expect(matchVoiceCommands("pode dar play no vídeo")).toEqual([]);
  });

  it("ignores a wake word followed by another word", () => {
    expect(matchVoiceCommands("o cronos está aberto")).toEqual([]);
  });

  it("ignores a wake word with nothing after it", () => {
    expect(matchVoiceCommands("cronos")).toEqual([]);
  });

  it("finds the command in the middle of a longer phrase", () => {
    expect(matchVoiceCommands("bom, agora cronos pause por favor")).toEqual([
      "pause",
    ]);
  });

  it("lists every command in a phrase Chrome merged into one", () => {
    expect(
      matchVoiceCommands(
        "cronos pausar cronos iniciar cronos para usar cronos pausar",
      ),
    ).toEqual(["pause", "start", "pause", "pause"]);
  });
});

describe("soundsLike", () => {
  it("rejects words two edits away", () => {
    expect(soundsLike("corno", "cronos")).toBe(false);
  });

  it("keeps short words to an exact sound match", () => {
    expect(soundsLike("por", "pause")).toBe(false);
  });
});

describe("isUnknownCommand", () => {
  it("flags a wake word followed by an unknown word", () => {
    expect(isUnknownCommand("cronos desliga")).toBe(true);
  });

  it("flags a wake word on its own", () => {
    expect(isUnknownCommand("cronos")).toBe(true);
  });

  it("accepts a known command", () => {
    expect(isUnknownCommand("cronos pausar")).toBe(false);
  });

  it("ignores speech without the wake word", () => {
    expect(isUnknownCommand("vou pausar o vídeo")).toBe(false);
  });
});
