CREATE TYPE "public"."sponsor_tier" AS ENUM('gold', 'silver', 'bronze');--> statement-breakpoint
CREATE TABLE "sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"logo_id" uuid,
	"website" varchar(500),
	"tier" "sponsor_tier" DEFAULT 'bronze' NOT NULL,
	"display_order" integer DEFAULT 0,
	"active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_logo_id_images_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."images"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sponsors_tier_idx" ON "sponsors" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "sponsors_active_idx" ON "sponsors" USING btree ("active");--> statement-breakpoint
CREATE INDEX "sponsors_display_order_idx" ON "sponsors" USING btree ("display_order");