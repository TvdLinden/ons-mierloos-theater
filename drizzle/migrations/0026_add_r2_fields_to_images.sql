-- Add R2 storage fields to images table
-- r2_url: Full public URL to image stored in Cloudflare R2
-- original_width: Original image width in pixels
-- original_height: Original image height in pixels

ALTER TABLE "images" ADD COLUMN "r2_url" text;
ALTER TABLE "images" ADD COLUMN "original_width" integer;
ALTER TABLE "images" ADD COLUMN "original_height" integer;

-- Create index for finding non-migrated images
CREATE INDEX "images_r2_url_null_idx" ON "images" ("r2_url") WHERE "r2_url" IS NULL;
