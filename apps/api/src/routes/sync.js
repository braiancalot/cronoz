import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { and, count, eq, gt, inArray, sql } from "drizzle-orm";
import { pullRequestSchema, pushRequestSchema } from "@cronoz/shared";
import { db } from "../db/index.js";
import { devices, projects, settings, syncCursors } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

class SyncError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

const syncRouter = new Hono();

syncRouter.use("*", authMiddleware);

syncRouter.post("/push", zValidator("json", pushRequestSchema), async (c) => {
  const syncGroupId = c.get("syncGroupId");
  const { projects: incomingProjects, settings: incomingSettings } =
    c.req.valid("json");
  const serverTimestamp = Date.now();

  try {
    await db.transaction(async (tx) => {
      if (incomingProjects.length > 0) {
        const ids = incomingProjects.map((p) => p.id);
        const existing = await tx
          .select({
            id: projects.id,
            syncGroupId: projects.syncGroupId,
          })
          .from(projects)
          .where(inArray(projects.id, ids));

        for (const row of existing) {
          if (row.syncGroupId !== syncGroupId) {
            throw new SyncError(409, "project_belongs_to_other_group");
          }
        }
      }

      for (const project of incomingProjects) {
        await tx
          .insert(projects)
          .values({
            id: project.id,
            syncGroupId,
            data: project,
            updatedAt: project.updatedAt ?? 0,
            serverUpdatedAt: serverTimestamp,
            deletedAt: project.deletedAt ?? null,
          })
          .onConflictDoUpdate({
            target: projects.id,
            set: {
              data: sql`excluded.data`,
              updatedAt: sql`excluded.updated_at`,
              serverUpdatedAt: sql`excluded.server_updated_at`,
              deletedAt: sql`excluded.deleted_at`,
            },
            setWhere: sql`${projects.updatedAt} < excluded.updated_at`,
          });
      }

      for (const setting of incomingSettings) {
        await tx
          .insert(settings)
          .values({
            syncGroupId,
            key: setting.key,
            value: setting.value,
            updatedAt: setting.updatedAt ?? 0,
            serverUpdatedAt: serverTimestamp,
          })
          .onConflictDoUpdate({
            target: [settings.syncGroupId, settings.key],
            set: {
              value: sql`excluded.value`,
              updatedAt: sql`excluded.updated_at`,
              serverUpdatedAt: sql`excluded.server_updated_at`,
            },
            setWhere: sql`${settings.updatedAt} < excluded.updated_at`,
          });
      }
    });
  } catch (err) {
    if (err instanceof SyncError) {
      return c.json({ error: err.code }, err.status);
    }
    throw err;
  }

  return c.json({ ok: true, serverTimestamp });
});

syncRouter.post("/pull", zValidator("json", pullRequestSchema), async (c) => {
  const syncGroupId = c.get("syncGroupId");
  const deviceId = c.get("deviceId");
  const { cursor } = c.req.valid("json");

  const projectRows = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.syncGroupId, syncGroupId),
        gt(projects.serverUpdatedAt, cursor),
      ),
    );

  const settingRows = await db
    .select()
    .from(settings)
    .where(
      and(
        eq(settings.syncGroupId, syncGroupId),
        gt(settings.serverUpdatedAt, cursor),
      ),
    );

  const timestamps = [
    ...projectRows.map((r) => r.serverUpdatedAt),
    ...settingRows.map((r) => r.serverUpdatedAt),
  ];
  const newCursor = timestamps.length > 0 ? Math.max(...timestamps) : cursor;

  await db
    .insert(syncCursors)
    .values({ deviceId, lastPulledAt: newCursor })
    .onConflictDoUpdate({
      target: syncCursors.deviceId,
      set: { lastPulledAt: newCursor },
    });

  await db
    .update(devices)
    .set({ lastSeenAt: new Date() })
    .where(eq(devices.id, deviceId));

  return c.json({
    projects: projectRows.map((r) => r.data),
    settings: settingRows.map((r) => ({
      key: r.key,
      value: r.value,
      updatedAt: r.updatedAt,
    })),
    cursor: newCursor,
  });
});

syncRouter.get("/devices", async (c) => {
  const syncGroupId = c.get("syncGroupId");
  const [row] = await db
    .select({ count: count() })
    .from(devices)
    .where(eq(devices.syncGroupId, syncGroupId));
  return c.json({ count: row?.count ?? 0 });
});

export default syncRouter;
