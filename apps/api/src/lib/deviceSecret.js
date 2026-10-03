import { createHash, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { devices } from "../db/schema.js";

// The secret is 32 random bytes, so there is nothing to brute-force out of a
// leaked hash and a slow hash would buy nothing.
export function hashDeviceSecret(secret) {
  return createHash("sha256").update(secret).digest("hex");
}

export function deviceSecretMatches(device, secret) {
  const presented = Buffer.from(hashDeviceSecret(secret), "hex");
  return timingSafeEqual(presented, Buffer.from(device.secretHash, "hex"));
}

export async function findDevice(tx, deviceId) {
  const [device] = await tx
    .select()
    .from(devices)
    .where(eq(devices.id, deviceId));
  return device;
}
