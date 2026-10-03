import { describe, it, expect } from "vitest";
import { SECRET_A, SECRET_B } from "../../../test/pairingFixtures.js";
import { deviceSecretMatches, hashDeviceSecret } from "../deviceSecret.js";

describe("hashDeviceSecret", () => {
  it("returns the SHA-256 of the secret as hex", () => {
    expect(hashDeviceSecret("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("gives different hashes to different secrets", () => {
    expect(hashDeviceSecret(SECRET_A)).not.toBe(hashDeviceSecret(SECRET_B));
  });
});

describe("deviceSecretMatches", () => {
  const device = { secretHash: hashDeviceSecret(SECRET_A) };

  it("accepts the secret the device registered", () => {
    expect(deviceSecretMatches(device, SECRET_A)).toBe(true);
  });

  it("refuses any other secret", () => {
    expect(deviceSecretMatches(device, SECRET_B)).toBe(false);
  });
});
