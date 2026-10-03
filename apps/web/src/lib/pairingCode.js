import { PAIRING_CODE_ALPHABET, PAIRING_CODE_LENGTH } from "@cronoz/shared";

export function normalizePairingCode(raw) {
  return [...raw.toUpperCase()]
    .filter((char) => PAIRING_CODE_ALPHABET.includes(char))
    .join("")
    .slice(0, PAIRING_CODE_LENGTH);
}

export function formatPairingCode(code) {
  const half = PAIRING_CODE_LENGTH / 2;
  return `${code.slice(0, half)}-${code.slice(half)}`;
}
