import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { pairingCodes } from "../../db/schema.js";
import { PAIRING_CODE_MAX_FAILED_JOINS } from "../../lib/pairingCode.js";
import {
  DEVICE_A,
  DEVICE_B,
  DEVICE_C,
  credentialOf,
  initiate,
  join,
  post,
} from "../../../test/pairingFixtures.js";

async function statusOf(deviceId, code) {
  const res = await post("/api/pair/status", { code }, credentialOf(deviceId));
  expect(res.status).toBe(200);
  return (await res.json()).status;
}

function editCode(code, changes) {
  return db
    .update(pairingCodes)
    .set(changes)
    .where(eq(pairingCodes.code, code));
}

describe("POST /api/pair/status", () => {
  it("reports waiting while nobody has joined", async () => {
    const code = await initiate(DEVICE_A);
    expect(await statusOf(DEVICE_A, code)).toBe("waiting");
  });

  it("reports joined once another device used the code", async () => {
    const code = await initiate(DEVICE_A);
    await join(DEVICE_B, code);

    expect(await statusOf(DEVICE_A, code)).toBe("joined");
  });

  it("reports expired after the code's lifetime", async () => {
    const code = await initiate(DEVICE_A);
    await editCode(code, { expiresAt: new Date(Date.now() - 1000) });

    expect(await statusOf(DEVICE_A, code)).toBe("expired");
  });

  it("reports burned when failed joins killed the code", async () => {
    const code = await initiate(DEVICE_A);
    await editCode(code, { failedJoins: PAIRING_CODE_MAX_FAILED_JOINS });

    expect(await statusOf(DEVICE_A, code)).toBe("burned");
  });

  it("reports expired for a code that does not exist", async () => {
    await initiate(DEVICE_A);
    expect(await statusOf(DEVICE_A, "22222222")).toBe("expired");
  });

  it("does not reveal a live code to a device that did not generate it", async () => {
    const code = await initiate(DEVICE_A);
    expect(await statusOf(DEVICE_C, code)).toBe("expired");
  });

  it("returns 400 for a malformed code", async () => {
    const res = await post(
      "/api/pair/status",
      { code: "0000OOOO" },
      credentialOf(DEVICE_A),
    );
    expect(res.status).toBe(400);
  });
});
