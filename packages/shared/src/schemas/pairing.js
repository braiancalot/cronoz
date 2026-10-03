import { z } from "zod";
import { PAIRING_CODE_ALPHABET, PAIRING_CODE_LENGTH } from "../constants.js";

const pairingCodeSchema = z
  .string()
  .regex(new RegExp(`^[${PAIRING_CODE_ALPHABET}]{${PAIRING_CODE_LENGTH}}$`));

export const pairInitiateResponseSchema = z.object({
  code: pairingCodeSchema,
  expiresAt: z.string().datetime(),
});

export const pairJoinRequestSchema = z.object({
  code: pairingCodeSchema,
});

export const pairJoinResponseSchema = z.object({
  syncGroupId: z.string().uuid(),
});

export const PAIRING_STATUSES = ["waiting", "joined", "expired", "burned"];

export const pairStatusRequestSchema = z.object({
  code: pairingCodeSchema,
});

export const pairStatusResponseSchema = z.object({
  status: z.enum(PAIRING_STATUSES),
});
