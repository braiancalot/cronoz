import { z } from "zod";

export const lapSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
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
  laps: z.array(lapSchema),
});

export const projectSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  completedAt: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
  deletedAt: z.number().nullable().optional(),
  stopwatch: stopwatchSchema,
});
