ALTER TABLE "pairing_codes" ALTER COLUMN "code" SET DATA TYPE char(8);--> statement-breakpoint
ALTER TABLE "pairing_codes" ADD COLUMN "failed_joins" integer DEFAULT 0 NOT NULL;