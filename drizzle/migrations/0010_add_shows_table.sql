-- Migration: Split performances into shows and performances
-- This migration creates a show/performance structure where:
-- - Shows represent the production/content (title, description, images, tags)
-- - Performances represent specific time slots for shows (date, seats, status)

-- Step 1: Create show_status enum
DO $$ BEGIN
 CREATE TYPE "public"."show_status" AS ENUM('draft', 'published', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Step 2: Update performance_status enum to add new statuses
ALTER TYPE "public"."performance_status" ADD VALUE IF NOT EXISTS 'sold_out';
ALTER TYPE "public"."performance_status" ADD VALUE IF NOT EXISTS 'cancelled';

-- Step 3: Create shows table
CREATE TABLE IF NOT EXISTS "public"."shows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"subtitle" varchar(255),
	"slug" varchar(255) NOT NULL UNIQUE,
	"description" text,
	"image_id" uuid REFERENCES "public"."images"("id") ON DELETE set null,
	"thumbnail_image_id" uuid REFERENCES "public"."images"("id") ON DELETE set null,
	"base_price" numeric(8, 2),
	"status" "show_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "shows_title_idx" ON "public"."shows" ("title");
CREATE INDEX IF NOT EXISTS "shows_slug_idx" ON "public"."shows" ("slug");
CREATE INDEX IF NOT EXISTS "shows_status_idx" ON "public"."shows" ("status");

-- Step 4: Create show_tags junction table
CREATE TABLE IF NOT EXISTS "public"."show_tags" (
	"show_id" uuid NOT NULL REFERENCES "public"."shows"("id") ON DELETE cascade,
	"tag_id" uuid NOT NULL REFERENCES "public"."tags"("id") ON DELETE cascade,
	"created_at" timestamp with time zone DEFAULT now(),
	PRIMARY KEY ("show_id", "tag_id")
);

CREATE INDEX IF NOT EXISTS "show_tags_show_id_idx" ON "public"."show_tags" ("show_id");
CREATE INDEX IF NOT EXISTS "show_tags_tag_id_idx" ON "public"."show_tags" ("tag_id");

-- Step 5: Migrate existing performances to shows
-- Each existing performance becomes a show with one performance time slot
INSERT INTO "public"."shows" (
	"id",
	"title",
	"subtitle", 
	"slug",
	"description",
	"image_id",
	"thumbnail_image_id",
	"base_price",
	"status",
	"created_at",
	"updated_at"
)
SELECT 
	gen_random_uuid() as "id",
	"title",
	"subtitle",
	"slug",
	"description",
	"image_id",
	"thumbnail_image_id",
	"price" as "base_price",
	CASE 
		WHEN "status" = 'draft' THEN 'draft'::show_status
		WHEN "status" = 'published' THEN 'published'::show_status
		WHEN "status" = 'archived' THEN 'archived'::show_status
		ELSE 'draft'::show_status
	END as "status",
	now() as "created_at",
	now() as "updated_at"
FROM "public"."performances"
WHERE "title" IS NOT NULL;

-- Step 6: Migrate performance_tags to show_tags
-- Link tags to the newly created shows based on matching slugs
INSERT INTO "public"."show_tags" ("show_id", "tag_id", "created_at")
SELECT DISTINCT
	s."id" as "show_id",
	pt."tag_id",
	pt."created_at"
FROM "public"."performance_tags" pt
JOIN "public"."performances" p ON pt."performance_id" = p."id"
JOIN "public"."shows" s ON p."slug" = s."slug"
ON CONFLICT DO NOTHING;

-- Step 7: Add show_id column to performances (will be populated next)
ALTER TABLE "public"."performances" ADD COLUMN IF NOT EXISTS "show_id" uuid;
ALTER TABLE "public"."performances" ADD COLUMN IF NOT EXISTS "total_seats" integer DEFAULT 100;
ALTER TABLE "public"."performances" ADD COLUMN IF NOT EXISTS "available_seats" integer DEFAULT 100;
ALTER TABLE "public"."performances" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "public"."performances" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."performances" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();

-- Step 8: Link existing performances to shows based on slug
UPDATE "public"."performances" p
SET "show_id" = s."id"
FROM "public"."shows" s
WHERE p."slug" = s."slug";

-- Step 9: Make show_id NOT NULL and add foreign key constraint
ALTER TABLE "public"."performances" ALTER COLUMN "show_id" SET NOT NULL;
ALTER TABLE "public"."performances" ADD CONSTRAINT "performances_show_id_fkey" 
	FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade;

-- Step 10: Make date NOT NULL and status NOT NULL
ALTER TABLE "public"."performances" ALTER COLUMN "date" SET NOT NULL;
ALTER TABLE "public"."performances" ALTER COLUMN "status" SET NOT NULL;

-- Step 11: Add indexes for performances
CREATE INDEX IF NOT EXISTS "performances_show_id_idx" ON "public"."performances" ("show_id");

-- Step 12: Drop old columns from performances that are now in shows
ALTER TABLE "public"."performances" DROP COLUMN IF EXISTS "title";
ALTER TABLE "public"."performances" DROP COLUMN IF EXISTS "subtitle";
ALTER TABLE "public"."performances" DROP COLUMN IF EXISTS "slug";
ALTER TABLE "public"."performances" DROP COLUMN IF EXISTS "description";
ALTER TABLE "public"."performances" DROP COLUMN IF EXISTS "image_id";
ALTER TABLE "public"."performances" DROP COLUMN IF EXISTS "thumbnail_image_id";

-- Drop old indexes that referenced dropped columns
DROP INDEX IF EXISTS "performances_title_idx";
DROP INDEX IF EXISTS "performances_slug_idx";

-- Step 13: Drop old performance_tags table (replaced by show_tags)
DROP TABLE IF EXISTS "public"."performance_tags";
