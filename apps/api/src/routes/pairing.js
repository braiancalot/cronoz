import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { and, eq, gt, isNull, lt, lte, sql } from "drizzle-orm";
import { pairJoinRequestSchema, pairStatusRequestSchema } from "@cronoz/shared";
import { db } from "../db/index.js";
import { devices, pairingCodes, syncGroups } from "../db/schema.js";
import {
  discardUnusedGroup,
  isNewGroupQuotaSpent,
  purgeAbandonedGroups,
} from "../lib/groupQuota.js";
import {
  deviceSecretMatches,
  findDevice,
  hashDeviceSecret,
} from "../lib/deviceSecret.js";
import {
  PAIRING_CODE_MAX_FAILED_JOINS,
  computeExpiresAt,
  generateCode,
  pairingStatusOf,
} from "../lib/pairingCode.js";
import { readDeviceCredential } from "../middleware/auth.js";

class PairError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

const pairingRouter = new Hono();

function pairingCaller(c) {
  const credential = readDeviceCredential(c);
  if (!credential) throw new PairError(401, "missing_device_credential");
  return credential;
}

// Undefined for a device the server has never seen.
async function provenDevice(tx, { deviceId, secret }) {
  const device = await findDevice(tx, deviceId);
  if (device && !deviceSecretMatches(device, secret)) {
    throw new PairError(401, "invalid_device_credential");
  }
  return device;
}

function newDeviceRow({ deviceId, secret }, syncGroupId) {
  return { id: deviceId, syncGroupId, secretHash: hashDeviceSecret(secret) };
}

pairingRouter.post("/initiate", async (c) => {
  try {
    const caller = pairingCaller(c);
    const issued = await db.transaction((tx) => issueCode(tx, caller));
    return c.json({
      code: issued.code,
      expiresAt: issued.expiresAt.toISOString(),
    });
  } catch (err) {
    return pairErrorResponse(c, err);
  }
});

function pairErrorResponse(c, err) {
  if (!(err instanceof PairError)) throw err;
  return c.json({ error: err.code }, err.status);
}

async function issueCode(tx, caller) {
  const { deviceId } = caller;
  await tx.delete(pairingCodes).where(lte(pairingCodes.expiresAt, new Date()));
  await purgeAbandonedGroups(tx);

  const device = await findOrCreateDevice(tx, caller);
  await tx
    .delete(pairingCodes)
    .where(
      and(eq(pairingCodes.deviceId, deviceId), isNull(pairingCodes.usedAt)),
    );

  const code = await pickUnusedCode(tx);
  const expiresAt = computeExpiresAt();
  await tx
    .insert(pairingCodes)
    .values({ code, syncGroupId: device.syncGroupId, deviceId, expiresAt });
  return { code, expiresAt };
}

async function findOrCreateDevice(tx, caller) {
  const known = await provenDevice(tx, caller);
  if (known) return known;

  if (await isNewGroupQuotaSpent(tx)) {
    throw new PairError(429, "too_many_new_groups");
  }
  const [group] = await tx.insert(syncGroups).values({}).returning();
  const [created] = await tx
    .insert(devices)
    .values(newDeviceRow(caller, group.id))
    .returning();
  return created;
}

async function pickUnusedCode(tx) {
  let candidate;
  for (let i = 0; i < 10; i++) {
    candidate = generateCode();
    const taken = await tx
      .select({ code: pairingCodes.code })
      .from(pairingCodes)
      .where(eq(pairingCodes.code, candidate));
    if (taken.length === 0) break;
  }
  return candidate;
}

pairingRouter.post(
  "/join",
  zValidator("json", pairJoinRequestSchema),
  async (c) => {
    const { code } = c.req.valid("json");

    try {
      const caller = pairingCaller(c);
      const syncGroupId = await db.transaction(async (tx) => {
        const pairing = await claimCode(tx, code);
        if (!pairing) {
          await countFailedJoin(tx);
          return null;
        }
        await joinGroup(tx, caller, pairing.syncGroupId);
        return pairing.syncGroupId;
      });

      if (!syncGroupId) {
        return c.json({ error: "invalid_or_expired_code" }, 400);
      }
      return c.json({ syncGroupId });
    } catch (err) {
      return pairErrorResponse(c, err);
    }
  },
);

function liveCodeConditions(now = new Date()) {
  return [
    isNull(pairingCodes.usedAt),
    gt(pairingCodes.expiresAt, now),
    lt(pairingCodes.failedJoins, PAIRING_CODE_MAX_FAILED_JOINS),
  ];
}

async function claimCode(tx, code) {
  const [pairing] = await tx
    .update(pairingCodes)
    .set({ usedAt: new Date() })
    .where(and(eq(pairingCodes.code, code), ...liveCodeConditions()))
    .returning();
  return pairing;
}

// A wrong guess counts against every live code, not the one guessed: the
// guesser does not know which codes exist, so per-code counters stop nothing.
async function countFailedJoin(tx) {
  await tx
    .update(pairingCodes)
    .set({ failedJoins: sql`${pairingCodes.failedJoins} + 1` })
    .where(and(...liveCodeConditions()));
}

async function joinGroup(tx, caller, syncGroupId) {
  const existing = await provenDevice(tx, caller);

  if (existing?.syncGroupId === syncGroupId) return;
  // The delete cascades to the device row, so it is inserted again below.
  if (existing && !(await discardUnusedGroup(tx, existing.syncGroupId))) {
    throw new PairError(409, "device_already_paired");
  }
  await tx.insert(devices).values(newDeviceRow(caller, syncGroupId));
}

// The code alone would let anyone probe codes without tripping the failed-join
// brake, so the lookup also demands the device that generated it.
pairingRouter.post(
  "/status",
  zValidator("json", pairStatusRequestSchema),
  async (c) => {
    const { code } = c.req.valid("json");

    try {
      const { deviceId } = await provenCaller(c);
      const [pairing] = await db
        .select()
        .from(pairingCodes)
        .where(
          and(eq(pairingCodes.code, code), eq(pairingCodes.deviceId, deviceId)),
        );
      return c.json({ status: pairingStatusOf(pairing) });
    } catch (err) {
      return pairErrorResponse(c, err);
    }
  },
);

async function provenCaller(c) {
  const caller = pairingCaller(c);
  await provenDevice(db, caller);
  return caller;
}

export default pairingRouter;
