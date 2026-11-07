import { z } from "zod";
import {
  MAX_SETTING_KEY_LENGTH,
  MAX_SETTING_STRING_LENGTH,
} from "../constants.js";

export const settingSchema = z.object({
  key: z.string().max(MAX_SETTING_KEY_LENGTH),
  value: z.union([
    z.number(),
    z.boolean(),
    z.string().max(MAX_SETTING_STRING_LENGTH),
  ]),
  updatedAt: z.number().optional(),
});
