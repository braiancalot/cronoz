import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

const secret = new TextEncoder().encode(JWT_SECRET);
const ALGORITHM = "HS256";

export async function signToken({ deviceId, syncGroupId }) {
  return new SignJWT({ deviceId, syncGroupId })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, secret, {
    algorithms: [ALGORITHM],
  });
  return payload;
}
