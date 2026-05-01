import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { and, eq, gt, isNull, lte } from "drizzle-orm";
import {
  pairInitiateRequestSchema,
  pairJoinRequestSchema,
  pairTokenRequestSchema,
} from "@cronoz/shared";
import { db } from "../db/index.js";
import { devices, pairingCodes, syncGroups } from "../db/schema.js";
import { signToken } from "../lib/jwt.js";
import { computeExpiresAt, generateCode } from "../lib/pairingCode.js";

class PairError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

const pairingRouter = new Hono();

pairingRouter.post(
  "/initiate",
  zValidator("json", pairInitiateRequestSchema),
  async (c) => {
    const { deviceId } = c.req.valid("json");

    const result = await db.transaction(async (tx) => {
      await tx
        .delete(pairingCodes)
        .where(lte(pairingCodes.expiresAt, new Date()));

      let [device] = await tx
        .select()
        .from(devices)
        .where(eq(devices.id, deviceId));

      if (!device) {
        const [group] = await tx.insert(syncGroups).values({}).returning();
        [device] = await tx
          .insert(devices)
          .values({ id: deviceId, syncGroupId: group.id })
          .returning();
      }

      await tx
        .delete(pairingCodes)
        .where(
          and(eq(pairingCodes.deviceId, deviceId), isNull(pairingCodes.usedAt)),
        );

      let newCode;
      for (let i = 0; i < 10; i++) {
        newCode = generateCode();
        const existing = await tx
          .select({ code: pairingCodes.code })
          .from(pairingCodes)
          .where(eq(pairingCodes.code, newCode));
        if (existing.length === 0) break;
      }

      const expiresAt = computeExpiresAt();
      await tx.insert(pairingCodes).values({
        code: newCode,
        syncGroupId: device.syncGroupId,
        deviceId,
        expiresAt,
      });

      return { code: newCode, expiresAt };
    });

    return c.json({
      code: result.code,
      expiresAt: result.expiresAt.toISOString(),
    });
  },
);

pairingRouter.post(
  "/join",
  zValidator("json", pairJoinRequestSchema),
  async (c) => {
    const { deviceId, code } = c.req.valid("json");

    try {
      const syncGroupId = await db.transaction(async (tx) => {
        const [pairing] = await tx
          .update(pairingCodes)
          .set({ usedAt: new Date() })
          .where(
            and(
              eq(pairingCodes.code, code),
              isNull(pairingCodes.usedAt),
              gt(pairingCodes.expiresAt, new Date()),
            ),
          )
          .returning();

        if (!pairing) {
          throw new PairError(400, "invalid_or_expired_code");
        }

        const [existing] = await tx
          .select()
          .from(devices)
          .where(eq(devices.id, deviceId));

        if (existing && existing.syncGroupId !== pairing.syncGroupId) {
          throw new PairError(409, "device_already_paired");
        }

        if (!existing) {
          await tx
            .insert(devices)
            .values({ id: deviceId, syncGroupId: pairing.syncGroupId });
        }

        return pairing.syncGroupId;
      });

      const token = await signToken({ deviceId, syncGroupId });
      return c.json({ token, syncGroupId });
    } catch (err) {
      if (err instanceof PairError) {
        return c.json({ error: err.code }, err.status);
      }
      throw err;
    }
  },
);

pairingRouter.post(
  "/token",
  zValidator("json", pairTokenRequestSchema),
  async (c) => {
    const { deviceId } = c.req.valid("json");
    const [device] = await db
      .select()
      .from(devices)
      .where(eq(devices.id, deviceId));

    if (!device) {
      return c.json({ error: "device_not_found" }, 404);
    }

    const token = await signToken({
      deviceId,
      syncGroupId: device.syncGroupId,
    });
    return c.json({ token, syncGroupId: device.syncGroupId });
  },
);

export default pairingRouter;
