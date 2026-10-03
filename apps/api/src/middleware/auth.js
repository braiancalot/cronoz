import { parseDeviceCredential } from "@cronoz/shared";
import { db } from "../db/index.js";
import { acceptDeviceSecret, findDevice } from "../lib/deviceSecret.js";
import { verifyToken } from "../lib/jwt.js";

const BEARER_PREFIX = "Bearer ";

export function readBearer(c) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith(BEARER_PREFIX)) return null;
  return authHeader.slice(BEARER_PREFIX.length);
}

export async function authMiddleware(c, next) {
  const bearer = readBearer(c);
  if (!bearer) {
    return c.json({ error: "Missing or invalid authorization" }, 401);
  }

  const device = await authenticate(bearer);
  if (!device) {
    return c.json({ error: "Invalid token" }, 401);
  }

  c.set("deviceId", device.id);
  c.set("syncGroupId", device.syncGroupId);
  await next();
}

function authenticate(bearer) {
  const credential = parseDeviceCredential(bearer);
  return credential ? deviceBySecret(credential) : deviceByLegacyToken(bearer);
}

async function deviceBySecret({ deviceId, secret }) {
  const device = await findDevice(db, deviceId);
  if (!device) return null;
  return (await acceptDeviceSecret(db, device, secret)) ? device : null;
}

// The token outlives the device row, so a removed device is only locked out
// if every request checks the row still exists in the claimed group.
// A device that has a secret is past tokens: one issued earlier stops working.
async function deviceByLegacyToken(token) {
  const claims = await readClaims(token);
  if (!claims) return null;

  const device = await findDevice(db, claims.deviceId);
  if (!device || device.secretHash) return null;
  return device.syncGroupId === claims.syncGroupId ? device : null;
}

async function readClaims(token) {
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}
