import { verifyToken } from "../lib/jwt.js";

export async function authMiddleware(c, next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid authorization" }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyToken(token);
    c.set("deviceId", payload.deviceId);
    c.set("syncGroupId", payload.syncGroupId);
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
}
