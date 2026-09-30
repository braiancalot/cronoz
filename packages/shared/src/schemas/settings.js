import { z } from "zod";
import { MAX_SETTING_KEY_LENGTH } from "../constants.js";

export const settingSchema = z.object({
  key: z.string().max(MAX_SETTING_KEY_LENGTH),
  value: z.union([z.number(), z.boolean()]),
  updatedAt: z.number().optional(),
});
