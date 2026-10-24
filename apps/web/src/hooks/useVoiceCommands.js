import { useEffect, useRef } from "react";

import { matchVoiceCommands, SPOKEN_COMMANDS } from "@/lib/voiceCommands.js";
import {
  getSpeechRecognition,
  // hasLocalModel,
} from "@/lib/speechRecognition.js";

const FATAL_ERRORS = ["not-allowed", "service-not-allowed", "audio-capture"];
const RETRY_DELAY_MS = 1000;
// Chrome caps boosts at 10; high values make it hear the phrase in unrelated speech.
const PHRASE_BOOST = 3;

class VoiceCommandListener {
  constructor({ Recognition, callbacks }) {
    this.Recognition = Recognition;
    this.recognition = new Recognition();
    this.recognition.lang = "pt-BR";
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.onresult = (event) => this.handleResult(event);
    this.recognition.onerror = (event) => this.handleError(event);
    this.recognition.onend = () => this.handleEnd();
    this.callbacks = callbacks;
    this.handleVisibilityChange = () => this.listenIfVisible();
    this.stopped = false;
    this.listening = false;
    this.lastError = null;
    this.retryTimer = null;
    this.firedCounts = new Map();
  }

  async start() {
    // Disabled: Chrome's on-device pt-BR model opens a session but returns no results.
    // if (await hasLocalModel(this.Recognition)) this.enableLocalModel();
    if (this.stopped) return;
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    this.listenIfVisible();
  }

  enableLocalModel() {
    this.recognition.processLocally = true;
    const Phrase = globalThis.SpeechRecognitionPhrase;
    if (!Phrase) return;
    this.recognition.phrases = SPOKEN_COMMANDS.map(
      (phrase) => new Phrase(phrase, PHRASE_BOOST),
    );
  }

  stop() {
    this.stopped = true;
    clearTimeout(this.retryTimer);
    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );
    this.recognition.abort();
  }

  listenIfVisible() {
    if (this.stopped || this.listening) return;
    if (document.visibilityState !== "visible") return;
    try {
      this.recognition.start();
    } catch {
      this.scheduleRestart(RETRY_DELAY_MS);
      return;
    }
    this.listening = true;
    this.firedCounts.clear();
    this.callbacks.current.onStatusChange("listening");
  }

  scheduleRestart(delay) {
    if (delay > 0) this.callbacks.current.onStatusChange("retrying");
    clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => this.listenIfVisible(), delay);
  }

  handleResult(event) {
    for (let index = event.resultIndex; index < event.results.length; index++) {
      const result = event.results[index];
      const transcript = result[0].transcript;
      this.callbacks.current.onTranscript({
        transcript,
        isFinal: result.isFinal,
      });
      this.fireNewCommands(index, matchVoiceCommands(transcript));
    }
  }

  // Results grow and get rewritten: only commands past the fired count are new.
  fireNewCommands(index, commands) {
    const firedCount = this.firedCounts.get(index) ?? 0;
    if (commands.length <= firedCount) return;
    this.firedCounts.set(index, commands.length);
    this.callbacks.current[commands.at(-1)]();
    // A fresh session per command keeps Chrome from merging later phrases into this one.
    this.recognition.abort();
  }

  handleError(event) {
    this.lastError = event.error;
    if (event.error === "phrases-not-supported") this.recognition.phrases = [];
    if (event.error === "language-not-supported") {
      this.recognition.processLocally = false;
    }
    if (!FATAL_ERRORS.includes(event.error)) return;
    this.stopped = true;
    this.callbacks.current.onStatusChange("blocked");
  }

  handleEnd() {
    this.listening = false;
    if (this.stopped) return;
    this.scheduleRestart(this.lastError === "network" ? RETRY_DELAY_MS : 0);
    this.lastError = null;
  }
}

export function useVoiceCommands({
  onStart,
  onPause,
  onTranscript = () => {},
  onStatusChange = () => {},
  enabled,
  Recognition = getSpeechRecognition(),
}) {
  const callbacksRef = useRef(null);

  useEffect(() => {
    callbacksRef.current = {
      start: onStart,
      pause: onPause,
      onTranscript,
      onStatusChange,
    };
  });

  useEffect(() => {
    if (!enabled || !Recognition) return;

    const listener = new VoiceCommandListener({
      Recognition,
      callbacks: callbacksRef,
    });
    listener.start();
    return () => listener.stop();
  }, [enabled, Recognition]);
}
