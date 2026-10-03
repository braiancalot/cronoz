import {
  PAIRING_CODE_ALPHABET,
  PAIRING_CODE_LENGTH,
  PAIRING_CODE_TTL_MS,
} from "@cronoz/shared";

// Failed joins allowed across all live codes before every one of them dies.
export const PAIRING_CODE_MAX_FAILED_JOINS = 5;

// Bytes at or above this would favour the first letters of the alphabet.
const UNBIASED_BYTE_LIMIT = 256 - (256 % PAIRING_CODE_ALPHABET.length);

export function generateCode(
  fillRandom = (array) => crypto.getRandomValues(array),
) {
  let code = "";
  while (code.length < PAIRING_CODE_LENGTH) {
    for (const byte of fillRandom(new Uint8Array(PAIRING_CODE_LENGTH))) {
      if (byte >= UNBIASED_BYTE_LIMIT) continue;
      code += PAIRING_CODE_ALPHABET[byte % PAIRING_CODE_ALPHABET.length];
    }
  }
  return code.slice(0, PAIRING_CODE_LENGTH);
}

export function computeExpiresAt(now = Date.now()) {
  return new Date(now + PAIRING_CODE_TTL_MS);
}

export function isExpired(expiresAt, now = Date.now()) {
  return expiresAt.getTime() <= now;
}
