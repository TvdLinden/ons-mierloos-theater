ALTER TABLE "images" ADD COLUMN "r2_url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "original_width" integer;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "original_height" integer;--> statement-breakpoint
ALTER TABLE "images" DROP COLUMN "image_lg";--> statement-breakpoint
ALTER TABLE "images" DROP COLUMN "image_md";--> statement-breakpoint
ALTER TABLE "images" DROP COLUMN "image_sm";