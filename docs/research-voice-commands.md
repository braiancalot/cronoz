# Voice commands: speech recognition

Voice commands ("cronos iniciar", "cronos pausar") use the Web Speech API in Chrome with cloud
recognition. Android and desktop Chrome only; iPhone is out of scope.

## Chosen: Web Speech API, cloud

- `lang = "pt-BR"`, `continuous`, `interimResults`. Commands fire on interim results; waiting for a
  final one lagged by seconds or never came.
- pt-BR transcribes "pause" as pose, pós, pousi. `lib/voiceCommands.js` matches the wake word and
  commands by a sound key plus edit distance 1.
- After a while a cloud session stops finalizing and merges every phrase into one growing interim
  result, rewriting earlier words. The listener counts commands per result and aborts the session
  after each command, so the next phrase starts fresh.
- Audio goes to Google, so it needs internet.
- A stuck Chrome state once made every session, even a bare one in the console, fire `start` and
  `end` with no result and no error. Resetting the site's microphone permission fixed it.
- Logged on PC: a fresh session after each abort is listening again within 70 ms. The wake word
  was sometimes heard as "prontos" or "bronze", which the sound key does not accept.

## Open

- Accept "prontos" and "bronze" as wake word variants (they only count before a command).
- The listener does not abort when the tab is hidden; check whether a hidden Cronoz tab keeps
  other tabs from recognizing.
- Latency compensation: discount the second between speaking and the command applying.

## Rejected for now: Chrome on-device (`processLocally`)

- PC Chrome reported pt-BR as `"downloadable"` and `SpeechRecognition.install` succeeded.
- Afterwards, a session with `processLocally = true` fires `start` and `end` with no `result` and
  no error, with or without `continuous` and `interimResults`. Reproduce in the console with
  `new webkitSpeechRecognition()`, `lang = "pt-BR"`, `processLocally = true`, `start()`.
- The install-on-enable flow, `processLocally` and `phrases` biasing are kept in the code with
  their call sites commented out (`useVoiceCommands.js`, `useVoiceCommandsSetting.js`) and their
  tests skipped. Re-test on a newer Chrome before enabling.

## Not tried: Vosk

Offline recognition in the browser with a vocabulary restricted to the commands. Model of 30 to
50 MB; grammar support in the browser package is unverified. Worth a PoC only if cloud recognition
proves unreliable in real use.
