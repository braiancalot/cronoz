const WAKE_WORD = "cronos";

const COMMAND_WORDS = {
  start: ["play", "plei", "iniciar", "comecar", "continuar", "start"],
  pause: ["pause", "pausar", "pausa", "parar", "stop"],
};

export const SPOKEN_COMMANDS = ["iniciar", "pausar", "play", "pause"].map(
  (command) => `${WAKE_WORD} ${command}`,
);

// Collapses spellings the recognizer swaps for the same sound (kronos, cronus, pose).
const SOUND_RULES = [
  [/ch|k/g, "c"],
  [/z/g, "s"],
  [/y/g, "i"],
  [/au|ou/g, "o"],
  [/u/g, "o"],
  [/[ei]$/, ""],
  [/s$/, ""],
];

const MIN_FUZZY_LENGTH = 4;

function toWords(transcript) {
  return transcript
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function toSoundKey(word) {
  return SOUND_RULES.reduce(
    (key, [pattern, replacement]) => key.replace(pattern, replacement),
    word,
  );
}

function editDistance(source, target) {
  let previousRow = Array.from({ length: target.length + 1 }, (_, i) => i);
  for (let i = 1; i <= source.length; i++) {
    const row = [i];
    for (let j = 1; j <= target.length; j++) {
      const substitution = source[i - 1] === target[j - 1] ? 0 : 1;
      row[j] = Math.min(
        previousRow[j] + 1,
        row[j - 1] + 1,
        previousRow[j - 1] + substitution,
      );
    }
    previousRow = row;
  }
  return previousRow[target.length];
}

export function soundsLike(word, target) {
  const wordKey = toSoundKey(word);
  const targetKey = toSoundKey(target);
  if (wordKey === targetKey) return true;
  if (Math.min(wordKey.length, targetKey.length) < MIN_FUZZY_LENGTH) {
    return false;
  }
  return editDistance(wordKey, targetKey) <= 1;
}

function toCommand(word) {
  if (!word) return null;
  const command = Object.keys(COMMAND_WORDS).find((name) =>
    COMMAND_WORDS[name].some((commandWord) => soundsLike(word, commandWord)),
  );
  return command ?? null;
}

export function matchVoiceCommands(transcript) {
  const words = toWords(transcript);
  return words
    .map((word, index) =>
      soundsLike(word, WAKE_WORD) ? toCommand(words[index + 1]) : null,
    )
    .filter(Boolean);
}

export function mentionsWakeWord(transcript) {
  return toWords(transcript).some((word) => soundsLike(word, WAKE_WORD));
}

export function isUnknownCommand(transcript) {
  return (
    mentionsWakeWord(transcript) && matchVoiceCommands(transcript).length === 0
  );
}
