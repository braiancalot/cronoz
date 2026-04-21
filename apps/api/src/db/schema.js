import {
  pgTable,
  uuid,
  text,
  timestamp,
  bigint,
  jsonb,
  char,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

export const syncGroups = pgTable("sync_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const devices = pgTable(
  "devices",
  {
    id: uuid("id").primaryKey(),
    syncGroupId: uuid("sync_group_id")
      .notNull()
      .references(() => syncGroups.id, { onDelete: "cascade" }),
    deviceName: text("device_name"),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
  },
  (t) => [index("devices_sync_group_idx").on(t.syncGroupId)],
);

export const pairingCodes = pgTable(
  "pairing_codes",
  {
    code: char("code", { length: 6 }).primaryKey(),
    syncGroupId: uuid("sync_group_id")
      .notNull()
      .references(() => syncGroups.id, { onDelete: "cascade" }),
    deviceId: uuid("device_id")
      .notNull()
      .references(() => devices.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
  },
  (t) => [index("pairing_codes_expires_at_idx").on(t.expiresAt)],
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey(),
    syncGroupId: uuid("sync_group_id")
      .notNull()
      .references(() => syncGroups.id, { onDelete: "cascade" }),
    data: jsonb("data").notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
    serverUpdatedAt: bigint("server_updated_at", { mode: "number" }).notNull(),
    deletedAt: bigint("deleted_at", { mode: "number" }),
  },
  (t) => [
    index("projects_sync_group_server_updated_idx").on(
      t.syncGroupId,
      t.serverUpdatedAt,
    ),
  ],
);

export const settings = pgTable(
  "settings",
  {
    syncGroupId: uuid("sync_group_id")
      .notNull()
      .references(() => syncGroups.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    value: jsonb("value"),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
    serverUpdatedAt: bigint("server_updated_at", { mode: "number" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.syncGroupId, t.key] }),
    index("settings_sync_group_server_updated_idx").on(
      t.syncGroupId,
      t.serverUpdatedAt,
    ),
  ],
);

export const syncCursors = pgTable("sync_cursors", {
  deviceId: uuid("device_id")
    .primaryKey()
    .references(() => devices.id, { onDelete: "cascade" }),
  lastPulledAt: bigint("last_pulled_at", { mode: "number" })
    .notNull()
    .default(0),
});
