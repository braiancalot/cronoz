import { z } from "zod";

export const DEVICE_SECRET_BYTES = 32;

const SECRET_SHAPE = new RegExp(`^[0-9a-f]{${DEVICE_SECRET_BYTES * 2}}$`);
const deviceIdSchema = z.string().uuid();

function fillWithCsprng(bytes) {
  return crypto.getRandomValues(bytes);
}

export function generateDeviceSecret(fillRandom = fillWithCsprng) {
  const bytes = fillRandom(new Uint8Array(DEVICE_SECRET_BYTES));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export function formatDeviceCredential({ deviceId, secret }) {
  return `${deviceId}.${secret}`;
}

// Null for anything else, a token from before device secrets included.
export function parseDeviceCredential(text) {
  if (typeof text !== "string") return null;

  const [deviceId, secret, ...rest] = text.split(".");
  if (rest.length > 0 || !SECRET_SHAPE.test(secret ?? "")) return null;
  if (!deviceIdSchema.safeParse(deviceId).success) return null;
  return { deviceId, secret };
}
