import { SignJWT, jwtVerify } from "jose";

import { assertUsableSecret } from "./jwtSecret.js";

const JWT_SECRET = assertUsableSecret(process.env.JWT_SECRET, {
  nodeEnv: process.env.NODE_ENV,
});

const secret = new TextEncoder().encode(JWT_SECRET);
const ALGORITHM = "HS256";

export async function signToken({ deviceId, syncGroupId }) {
  return new SignJWT({ deviceId, syncGroupId })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, secret, {
    algorithms: [ALGORITHM],
  });
  return payload;
}
