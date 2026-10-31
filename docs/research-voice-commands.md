# Voice commands: removed

Voice commands ("cronos iniciar", "cronos pausar") shipped as experimental on 2026-10-24 and were
removed on 2026-10-31. To read or restore the code, start from commit `a96599d`.

## The need, still open

The user's wife crochets while timing work. Pausing or starting by hand costs about one second per
action, and it means letting go of the work. Voice was meant to control the stopwatch with both
hands busy. Removing voice does not solve this.

## Why it was removed

Reliable recognition was out of reach for a small app, and errors change billed time.

- **Loose matching fires by itself.** Cloud recognition mishears the commands, so matching had to
  tolerate one edit. That also accepted `Bruno` as the wake word and `usar`, `pagar` or `pesar` as
  pause. "O Bruno continua" starts a stopped clock, and the only signal is a short text in the header.
- **Strict matching misses commands.** The wake word was also heard as "prontos" or "bronze". Adding
  "prontos" makes "prontos para começar" a pause, since `para` is a command.
- **No usable on-device recognition.** The microphone stayed open and audio went to Google for as
  long as a project was open. It also needed internet, in an offline-first app.
- **The gain was small against that cost:** about 1000 lines to replace a tap or Space.

## Chrome findings

These still apply to any new attempt with the Web Speech API.

- Commands must fire on interim results. Waiting for a final one lagged by seconds or never came.
- pt-BR transcribes "pause" as pose, pós, pousi.
- After a while a cloud session stops finalizing and merges every phrase into one growing interim
  result, rewriting earlier words. Aborting the session after each command avoids this. A fresh
  session was listening again within 70 ms on PC.
- A stuck Chrome state once made every session, even a bare one in the console, fire `start` and
  `end` with no result and no error. Resetting the site's microphone permission fixed it.
- `Permissions-Policy` must allow `microphone=(self)`, or production denies it while localhost works.

## Rejected: Chrome on-device (`processLocally`)

- PC Chrome reported pt-BR as `"downloadable"` and `SpeechRecognition.install` succeeded.
- Afterwards, a session with `processLocally = true` fires `start` and `end` with no `result` and
  no error, with or without `continuous` and `interimResults`. Reproduce in the console with
  `new webkitSpeechRecognition()`, `lang = "pt-BR"`, `processLocally = true`, `start()`.

## Not tried: Vosk

Offline recognition in the browser with a vocabulary restricted to the commands. Model of 30 to
50 MB; grammar support in the browser package is unverified.
