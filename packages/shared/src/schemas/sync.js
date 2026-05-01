import { z } from "zod";
import { projectSchema } from "./project.js";
import { settingSchema } from "./settings.js";

export const pushRequestSchema = z.object({
  projects: z.array(projectSchema),
  settings: z.array(settingSchema),
});

export const pushResponseSchema = z.object({
  ok: z.boolean(),
  serverTimestamp: z.number(),
});

export const pullRequestSchema = z.object({
  cursor: z.number(),
});

export const pullResponseSchema = z.object({
  projects: z.array(projectSchema),
  settings: z.array(settingSchema),
  cursor: z.number(),
});
