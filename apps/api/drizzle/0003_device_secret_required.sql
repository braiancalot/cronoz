DELETE FROM "devices" WHERE "secret_hash" IS NULL;--> statement-breakpoint
ALTER TABLE "devices" ALTER COLUMN "secret_hash" SET NOT NULL;
