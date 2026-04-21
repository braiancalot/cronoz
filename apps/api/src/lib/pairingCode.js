import { PAIRING_CODE_LENGTH, PAIRING_CODE_TTL_MS } from "@cronoz/shared";

export function generateCode() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const num = array[0] % 1_000_000;
  return num.toString().padStart(PAIRING_CODE_LENGTH, "0");
}

export function computeExpiresAt(now = Date.now()) {
  return new Date(now + PAIRING_CODE_TTL_MS);
}

export function isExpired(expiresAt, now = Date.now()) {
  return expiresAt.getTime() <= now;
}
