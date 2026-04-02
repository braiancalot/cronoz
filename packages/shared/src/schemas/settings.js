import { z } from "zod";

export const settingSchema = z.object({
  key: z.string(),
  value: z.unknown(),
  updatedAt: z.number().optional(),
});
