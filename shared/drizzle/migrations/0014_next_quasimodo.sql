CREATE TABLE "social_media_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" varchar(50) NOT NULL,
	"url" varchar(500) NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "social_media_links_display_order_idx" ON "social_media_links" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "social_media_links_active_idx" ON "social_media_links" USING btree ("active");