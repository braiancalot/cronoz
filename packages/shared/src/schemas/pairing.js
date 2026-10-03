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

export const pairTokenRequestSchema = z.object({
  deviceId: z.string().uuid(),
});

export const pairTokenResponseSchema = z.object({
  token: z.string(),
  syncGroupId: z.string().uuid(),
});
