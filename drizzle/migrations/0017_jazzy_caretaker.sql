ALTER TABLE "shows" DROP CONSTRAINT "shows_thumbnail_image_id_images_id_fk";
--> statement-breakpoint
ALTER TABLE "images" ALTER COLUMN "image_lg" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "images" ALTER COLUMN "image_md" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "images" ALTER COLUMN "image_sm" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "shows" DROP COLUMN "thumbnail_image_id";