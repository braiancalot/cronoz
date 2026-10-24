export class FakeSpeechRecognition {
  static instances = [];

  constructor() {
    this.startCount = 0;
    this.failNextStart = false;
    this.aborted = false;
    FakeSpeechRecognition.instances.push(this);
  }

  start() {
    this.startCount++;
    if (!this.failNextStart) return;
    this.failNextStart = false;
    throw new DOMException("already started", "InvalidStateError");
  }

  abort() {
    this.aborted = true;
    this.onerror({ error: "aborted" });
    this.onend();
  }

  say(transcript, { isFinal = true, index = 0 } = {}) {
    const result = Object.assign([{ transcript }], { isFinal });
    const results = Array(index).fill(null).concat([result]);
    this.onresult({ resultIndex: index, results });
  }

  fail(error) {
    this.onerror({ error });
    this.onend();
  }

  static get last() {
    return FakeSpeechRecognition.instances.at(-1);
  }
}

export class FakeSpeechRecognitionPhrase {
  constructor(phrase, boost) {
    this.phrase = phrase;
    this.boost = boost;
  }
}
