import { and, inArray, ne, sql } from "drizzle-orm";
import { projects } from "../db/schema.js";

const INCOMING_COLUMNS = {
  data: sql`excluded.data`,
  updatedAt: sql`excluded.updated_at`,
  serverUpdatedAt: sql`excluded.server_updated_at`,
  deletedAt: sql`excluded.deleted_at`,
};

// The group check MUST live in the write: a SELECT beforehand misses a row
// another group commits in between.
const SAME_GROUP_AND_OLDER = sql`${projects.syncGroupId} = excluded.sync_group_id AND ${projects.updatedAt} < excluded.updated_at`;

function toProjectRow({ syncGroupId, project, serverTimestamp }) {
  return {
    id: project.id,
    syncGroupId,
    data: project,
    updatedAt: project.updatedAt ?? 0,
    serverUpdatedAt: serverTimestamp,
    deletedAt: project.deletedAt ?? null,
  };
}

async function upsertGroupProject(tx, incoming) {
  const written = await tx
    .insert(projects)
    .values(toProjectRow(incoming))
    .onConflictDoUpdate({
      target: projects.id,
      set: INCOMING_COLUMNS,
      setWhere: SAME_GROUP_AND_OLDER,
    })
    .returning({ id: projects.id });
  return written.length > 0;
}

// Returns the ids left unwritten: stale ones, or ones another group holds.
export async function upsertGroupProjects(
  tx,
  { syncGroupId, incomingProjects, serverTimestamp },
) {
  const skippedIds = [];
  for (const project of incomingProjects) {
    const wasWritten = await upsertGroupProject(tx, {
      syncGroupId,
      project,
      serverTimestamp,
    });
    if (!wasWritten) skippedIds.push(project.id);
  }
  return skippedIds;
}

export async function findForeignProjectIds(tx, { syncGroupId, ids }) {
  if (ids.length === 0) return [];
  const foreign = await tx
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(inArray(projects.id, ids), ne(projects.syncGroupId, syncGroupId)),
    );
  return foreign.map((row) => row.id);
}
