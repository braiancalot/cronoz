import { describe, it, expect } from "vitest";
import { db } from "../../db/index.js";
import {
  DEVICE_A,
  SECRET_A,
  SECRET_B,
  initiate,
} from "../../../test/pairingFixtures.js";
import {
  acceptDeviceSecret,
  findDevice,
  hashDeviceSecret,
} from "../deviceSecret.js";

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

describe("acceptDeviceSecret for a row read before another request adopted", () => {
  async function staleRowAfterAdoption() {
    await initiate(DEVICE_A);
    const stale = await findDevice(db, DEVICE_A);
    await acceptDeviceSecret(db, stale, SECRET_A);
    return stale;
  }

  it("accepts the secret the other request stored", async () => {
    const stale = await staleRowAfterAdoption();

    expect(await acceptDeviceSecret(db, stale, SECRET_A)).toBe(true);
  });

  it("refuses a different secret and keeps the stored one", async () => {
    const stale = await staleRowAfterAdoption();

    expect(await acceptDeviceSecret(db, stale, SECRET_B)).toBe(false);
    const { secretHash } = await findDevice(db, DEVICE_A);
    expect(secretHash).toBe(hashDeviceSecret(SECRET_A));
  });
});
