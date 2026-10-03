import { z } from "zod";
import { PAIRING_CODE_ALPHABET, PAIRING_CODE_LENGTH } from "../constants.js";

const pairingCodeSchema = z
  .string()
  .regex(new RegExp(`^[${PAIRING_CODE_ALPHABET}]{${PAIRING_CODE_LENGTH}}$`));

export const pairInitiateRequestSchema = z.object({
  deviceId: z.string().uuid(),
});

export const pairInitiateResponseSchema = z.object({
  code: pairingCodeSchema,
  expiresAt: z.string().datetime(),
});

export const pairJoinRequestSchema = z.object({
  deviceId: z.string().uuid(),
  code: pairingCodeSchema,
});

export const pairJoinResponseSchema = z.object({
  token: z.string(),
  syncGroupId: z.string().uuid(),
});

export const PAIRING_STATUSES = ["waiting", "joined", "expired", "burned"];

export const pairStatusRequestSchema = z.object({
  deviceId: z.string().uuid(),
  code: pairingCodeSchema,
});

export const pairStatusResponseSchema = z.object({
  status: z.enum(PAIRING_STATUSES),
});

export const pairTokenRequestSchema = z.object({
  deviceId: z.string().uuid(),
});

export const pairTokenResponseSchema = z.object({
  token: z.string(),
  syncGroupId: z.string().uuid(),
});
