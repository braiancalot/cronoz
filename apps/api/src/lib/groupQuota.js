import { and, eq, gt, notExists, sql } from "drizzle-orm";
import {
  devices,
  pairingCodes,
  projects,
  settings,
  syncGroups,
} from "../db/schema.js";

// Across all callers: /pair/initiate is anonymous, so there is no identity to
// meter and the cap only has to keep the database from filling up.
export const MAX_NEW_GROUPS_PER_HOUR = 20;

export async function isNewGroupQuotaSpent(tx) {
  const [{ recentGroups }] = await tx
    .select({ recentGroups: sql`count(*)::int` })
    .from(syncGroups)
    .where(sql`${syncGroups.createdAt} > now() - interval '1 hour'`);
  return recentGroups >= MAX_NEW_GROUPS_PER_HOUR;
}

function ownedBy(table) {
  return eq(table.syncGroupId, syncGroups.id);
}

function hasNo(tx, table, ...conditions) {
  const rows = tx
    .select({ one: sql`1` })
    .from(table)
    .where(and(ownedBy(table), ...conditions));
  return notExists(rows);
}

// A group nobody joined and that never synced holds nothing worth keeping.
// The live-code check spares a device that is waiting for its partner now.
export async function purgeAbandonedGroups(tx) {
  const deviceCount = tx
    .select({ total: sql`count(*)` })
    .from(devices)
    .where(ownedBy(devices));
  await tx
    .delete(syncGroups)
    .where(
      and(
        sql`${syncGroups.createdAt} < now() - interval '24 hours'`,
        sql`(${deviceCount}) <= 1`,
        hasNo(tx, projects),
        hasNo(tx, settings),
        hasNo(tx, pairingCodes, gt(pairingCodes.expiresAt, new Date())),
      ),
    );
}
