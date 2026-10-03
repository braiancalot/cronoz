CREATE TABLE "devices" (
	"id" uuid PRIMARY KEY NOT NULL,
	"sync_group_id" uuid NOT NULL,
	"device_name" text,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pairing_codes" (
	"code" char(6) PRIMARY KEY NOT NULL,
	"sync_group_id" uuid NOT NULL,
	"device_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY NOT NULL,
	"sync_group_id" uuid NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" bigint NOT NULL,
	"server_updated_at" bigint NOT NULL,
	"deleted_at" bigint
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"sync_group_id" uuid NOT NULL,
	"key" text NOT NULL,
	"value" jsonb,
	"updated_at" bigint NOT NULL,
	"server_updated_at" bigint NOT NULL,
	CONSTRAINT "settings_sync_group_id_key_pk" PRIMARY KEY("sync_group_id","key")
);
--> statement-breakpoint
CREATE TABLE "sync_cursors" (
	"device_id" uuid PRIMARY KEY NOT NULL,
	"last_pulled_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_sync_group_id_sync_groups_id_fk" FOREIGN KEY ("sync_group_id") REFERENCES "public"."sync_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pairing_codes" ADD CONSTRAINT "pairing_codes_sync_group_id_sync_groups_id_fk" FOREIGN KEY ("sync_group_id") REFERENCES "public"."sync_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pairing_codes" ADD CONSTRAINT "pairing_codes_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_sync_group_id_sync_groups_id_fk" FOREIGN KEY ("sync_group_id") REFERENCES "public"."sync_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_sync_group_id_sync_groups_id_fk" FOREIGN KEY ("sync_group_id") REFERENCES "public"."sync_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_cursors" ADD CONSTRAINT "sync_cursors_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "devices_sync_group_idx" ON "devices" USING btree ("sync_group_id");--> statement-breakpoint
CREATE INDEX "pairing_codes_expires_at_idx" ON "pairing_codes" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "projects_sync_group_server_updated_idx" ON "projects" USING btree ("sync_group_id","server_updated_at");--> statement-breakpoint
CREATE INDEX "settings_sync_group_server_updated_idx" ON "settings" USING btree ("sync_group_id","server_updated_at");