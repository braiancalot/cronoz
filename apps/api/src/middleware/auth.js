import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { devices } from "../db/schema.js";
import { verifyToken } from "../lib/jwt.js";

export async function authMiddleware(c, next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid authorization" }, 401);
  }

  const claims = await readClaims(authHeader.slice(7));
  if (!claims || !(await isDeviceInGroup(claims))) {
    return c.json({ error: "Invalid token" }, 401);
  }

  c.set("deviceId", claims.deviceId);
  c.set("syncGroupId", claims.syncGroupId);
  await next();
}

async function readClaims(token) {
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

// The token outlives the device row, so a removed device is only locked out
// if every request checks the row still exists in the claimed group.
async function isDeviceInGroup({ deviceId, syncGroupId }) {
  const [device] = await db
    .select({ syncGroupId: devices.syncGroupId })
    .from(devices)
    .where(eq(devices.id, deviceId));
  return device?.syncGroupId === syncGroupId;
}
