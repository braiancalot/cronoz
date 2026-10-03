import { parseDeviceCredential } from "@cronoz/shared";
import { db } from "../db/index.js";
import { deviceSecretMatches, findDevice } from "../lib/deviceSecret.js";

const BEARER_PREFIX = "Bearer ";

// Null when the header is missing or does not hold a device credential.
export function readDeviceCredential(c) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith(BEARER_PREFIX)) return null;
  return parseDeviceCredential(authHeader.slice(BEARER_PREFIX.length));
}

export async function authMiddleware(c, next) {
  const credential = readDeviceCredential(c);
  if (!credential) {
    return c.json({ error: "missing_device_credential" }, 401);
  }

  const device = await deviceBySecret(credential);
  if (!device) {
    return c.json({ error: "invalid_device_credential" }, 401);
  }

  c.set("deviceId", device.id);
  c.set("syncGroupId", device.syncGroupId);
  await next();
}

// The row is read on every request, so deleting it is what revokes a device.
async function deviceBySecret({ deviceId, secret }) {
  const device = await findDevice(db, deviceId);
  if (!device) return null;
  return deviceSecretMatches(device, secret) ? device : null;
}
