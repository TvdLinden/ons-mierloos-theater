ALTER TABLE "shows" ADD COLUMN "blocks" jsonb;--> statement-breakpoint

UPDATE "shows"
SET "blocks" = jsonb_build_array(jsonb_build_object('type', 'text', 'content', "description"))
WHERE "description" IS NOT NULL AND "description" <> '';

ALTER TABLE "shows" DROP COLUMN "description";