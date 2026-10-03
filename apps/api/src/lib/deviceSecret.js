import { createHash, timingSafeEqual } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { devices } from "../db/schema.js";

// The secret is 32 random bytes, so there is nothing to brute-force out of a
// leaked hash and a slow hash would buy nothing.
export function hashDeviceSecret(secret) {
  return createHash("sha256").update(secret).digest("hex");
}

function matchesHash(secret, secretHash) {
  const presented = Buffer.from(hashDeviceSecret(secret), "hex");
  return timingSafeEqual(presented, Buffer.from(secretHash, "hex"));
}

export async function findDevice(tx, deviceId) {
  const [device] = await tx
    .select()
    .from(devices)
    .where(eq(devices.id, deviceId));
  return device;
}

// A device paired before device secrets keeps the first one presented for it.
// The row is read again because two first requests can race: the loser MUST
// be judged against the hash the winner stored, not refused.
async function adoptSecret(tx, deviceId, secret) {
  await tx
    .update(devices)
    .set({ secretHash: hashDeviceSecret(secret) })
    .where(and(eq(devices.id, deviceId), isNull(devices.secretHash)));
  const stored = await findDevice(tx, deviceId);
  return !!stored?.secretHash && matchesHash(secret, stored.secretHash);
}

// A null secret is a caller from before device secrets. It is accepted only
// while the device has no secret of its own.
export async function acceptDeviceSecret(tx, device, secret) {
  if (!device.secretHash) return !secret || adoptSecret(tx, device.id, secret);
  return !!secret && matchesHash(secret, device.secretHash);
}
