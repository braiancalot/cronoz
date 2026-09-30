import { z } from "zod";
import {
  MAX_LAP_NAME_LENGTH,
  MAX_LAPS_PER_PROJECT,
  MAX_PROJECT_NAME_LENGTH,
  MAX_TAG_LENGTH,
  MAX_TAGS_PER_PROJECT,
} from "../constants.js";

export const lapSchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(MAX_LAP_NAME_LENGTH),
  lapTime: z.number(),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
  deletedAt: z.number().nullable().optional(),
});

export const stopwatchSchema = z.object({
  startTimestamp: z.number().nullable(),
  currentLapTime: z.number(),
  isRunning: z.boolean(),
  lastActiveAt: z.number().nullable(),
  laps: z.array(lapSchema).max(MAX_LAPS_PER_PROJECT),
});

export const projectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(MAX_PROJECT_NAME_LENGTH),
  completedAt: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
  deletedAt: z.number().nullable().optional(),
  tags: z
    .array(z.string().max(MAX_TAG_LENGTH))
    .max(MAX_TAGS_PER_PROJECT)
    .optional(),
  stopwatch: stopwatchSchema,
});
