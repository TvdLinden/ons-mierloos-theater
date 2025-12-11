CREATE TYPE "public"."link_location" AS ENUM('header', 'footer');--> statement-breakpoint
CREATE TABLE "homepage_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intro_title" varchar(255),
	"intro_text" text,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "navigation_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" varchar(100) NOT NULL,
	"href" varchar(500) NOT NULL,
	"location" "link_location" NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "news_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"image_id" uuid,
	"published_at" timestamp with time zone,
	"active" integer DEFAULT 1 NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "navigation_links_location_idx" ON "navigation_links" USING btree ("location");--> statement-breakpoint
CREATE INDEX "navigation_links_display_order_idx" ON "navigation_links" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "navigation_links_active_idx" ON "navigation_links" USING btree ("active");--> statement-breakpoint
CREATE INDEX "news_articles_published_at_idx" ON "news_articles" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "news_articles_active_idx" ON "news_articles" USING btree ("active");--> statement-breakpoint
CREATE INDEX "news_articles_display_order_idx" ON "news_articles" USING btree ("display_order");