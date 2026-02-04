-- Remove legacy bytea image storage columns after R2 migration complete
-- All images have been migrated to R2 (r2_url populated)
-- This migration finalizes the cleanup and enforces R2 usage

-- Drop legacy bytea columns (now obsolete)
ALTER TABLE "images" DROP COLUMN "image_lg";
ALTER TABLE "images" DROP COLUMN "image_md";
ALTER TABLE "images" DROP COLUMN "image_sm";

-- Make r2_url NOT NULL now that all images use R2
ALTER TABLE "images" ALTER COLUMN "r2_url" SET NOT NULL;

-- Create index for frequently accessed R2 URLs
CREATE INDEX "images_r2_url_idx" ON "images" ("r2_url");
