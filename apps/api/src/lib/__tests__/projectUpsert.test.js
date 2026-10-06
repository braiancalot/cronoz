import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { projects as projectsTable } from "../../db/schema.js";
import {
  findForeignProjectIds,
  upsertGroupProjects,
} from "../projectUpsert.js";
import {
  DEVICE_A,
  DEVICE_B,
  DEVICE_C,
  DEVICE_D,
  pair,
} from "../../../test/pairingFixtures.js";
import {
  PROJECT_1,
  PROJECT_2,
  makeProject,
} from "../../../test/projectFixtures.js";

async function twoGroups() {
  const { syncGroupId: groupA } = await pair(DEVICE_A, DEVICE_B);
  const { syncGroupId: groupB } = await pair(DEVICE_C, DEVICE_D);
  return { groupA, groupB };
}

function upsertAs(syncGroupId, incomingProjects) {
  return upsertGroupProjects(db, {
    syncGroupId,
    incomingProjects,
    serverTimestamp: Date.now(),
  });
}

async function storedProject(id) {
  const [row] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, id));
  return row;
}

describe("upsertGroupProjects", () => {
  it("writes a new project and reports nothing skipped", async () => {
    const { groupA } = await twoGroups();

    const skippedIds = await upsertAs(groupA, [makeProject()]);

    expect(skippedIds).toEqual([]);
    expect((await storedProject(PROJECT_1)).syncGroupId).toBe(groupA);
  });

  it("skips a stale project of the same group", async () => {
    const { groupA } = await twoGroups();
    await upsertAs(groupA, [makeProject({ updatedAt: 2000, name: "newer" })]);

    const skippedIds = await upsertAs(groupA, [
      makeProject({ updatedAt: 1000, name: "older" }),
    ]);

    expect(skippedIds).toEqual([PROJECT_1]);
    expect((await storedProject(PROJECT_1)).data.name).toBe("newer");
  });

  // The write is the only guard when the row shows up after any earlier check.
  it("leaves another group's project untouched even with a newer updatedAt", async () => {
    const { groupA, groupB } = await twoGroups();
    await upsertAs(groupA, [makeProject({ updatedAt: 1000, name: "from A" })]);

    const skippedIds = await upsertAs(groupB, [
      makeProject({ updatedAt: 9000, name: "from B" }),
    ]);

    expect(skippedIds).toEqual([PROJECT_1]);
    const row = await storedProject(PROJECT_1);
    expect(row.syncGroupId).toBe(groupA);
    expect(row.updatedAt).toBe(1000);
    expect(row.data.name).toBe("from A");
  });
});

describe("findForeignProjectIds", () => {
  it("returns only the ids held by another group", async () => {
    const { groupA, groupB } = await twoGroups();
    await upsertAs(groupA, [makeProject()]);
    await upsertAs(groupB, [makeProject({ id: PROJECT_2 })]);

    const foreignIds = await findForeignProjectIds(db, {
      syncGroupId: groupB,
      ids: [PROJECT_1, PROJECT_2],
    });

    expect(foreignIds).toEqual([PROJECT_1]);
  });

  it("returns nothing for an empty id list", async () => {
    const { groupA } = await twoGroups();

    const foreignIds = await findForeignProjectIds(db, {
      syncGroupId: groupA,
      ids: [],
    });

    expect(foreignIds).toEqual([]);
  });
});
