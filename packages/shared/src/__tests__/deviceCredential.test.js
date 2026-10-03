import { describe, it, expect } from "vitest";
import {
  DEVICE_SECRET_BYTES,
  formatDeviceCredential,
  generateDeviceSecret,
  parseDeviceCredential,
} from "../deviceCredential.js";

const DEVICE_ID = "11111111-1111-1111-1111-111111111111";
const SECRET = "ab".repeat(DEVICE_SECRET_BYTES);

describe("generateDeviceSecret", () => {
  it("encodes every random byte as two hex digits", () => {
    const secret = generateDeviceSecret((bytes) => bytes.fill(10));

    expect(secret).toBe("0a".repeat(DEVICE_SECRET_BYTES));
  });

  it("draws a fresh secret on each call", () => {
    expect(generateDeviceSecret()).not.toBe(generateDeviceSecret());
  });
});

describe("parseDeviceCredential", () => {
  it("reads back what formatDeviceCredential wrote", () => {
    const credential = formatDeviceCredential({
      deviceId: DEVICE_ID,
      secret: SECRET,
    });

    expect(parseDeviceCredential(credential)).toEqual({
      deviceId: DEVICE_ID,
      secret: SECRET,
    });
  });

  it("accepts a freshly generated secret", () => {
    const secret = generateDeviceSecret();
    const credential = formatDeviceCredential({ deviceId: DEVICE_ID, secret });

    expect(parseDeviceCredential(credential)).toEqual({
      deviceId: DEVICE_ID,
      secret,
    });
  });

  it.each([
    ["a JWT", "eyJhbGciOiJIUzI1NiJ9.eyJkZXZpY2VJZCI6IngifQ.c2lnbmF0dXJl"],
    ["a bare device id", DEVICE_ID],
    ["a device id that is not a uuid", `not-a-uuid.${SECRET}`],
    ["a short secret", `${DEVICE_ID}.${SECRET.slice(2)}`],
    ["a secret that is not hex", `${DEVICE_ID}.${"zz".repeat(32)}`],
    ["an empty string", ""],
  ])("returns null for %s", (_label, text) => {
    expect(parseDeviceCredential(text)).toBeNull();
  });

  it.each([[undefined], [null]])("returns null for %s", (missing) => {
    expect(parseDeviceCredential(missing)).toBeNull();
  });
});
